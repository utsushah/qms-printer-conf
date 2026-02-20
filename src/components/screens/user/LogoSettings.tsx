import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon, Upload, Trash2, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { esp32Api } from '@/api/esp32';

interface LogoSettingsProps {
  onBack: () => void;
}

const MAX_WIDTH = 320;

/**
 * Converts an image file to a raw monochrome raster binary (.bin) for ESC/POS thermal printers.
 * Format: Raw 1-bit pixel data, no headers, top-to-bottom, MSB first, black=1.
 * Width is padded to multiple of 8. Each row = width/8 bytes.
 * This is the format expected by GS v 0 raster command on ESP32.
 */
const convertToMonoRasterBin = async (file: File): Promise<{ blob: Blob; previewUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        width = Math.ceil(width / 8) * 8;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        const widthBytes = width / 8;
        const totalBytes = widthBytes * height;
        const buffer = new Uint8Array(totalBytes);

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            const gray = pixels[srcIdx] * 0.299 + pixels[srcIdx + 1] * 0.587 + pixels[srcIdx + 2] * 0.114;
            if (gray <= 128) {
              const byteIdx = y * widthBytes + Math.floor(x / 8);
              const bitIdx = 7 - (x % 8);
              buffer[byteIdx] |= (1 << bitIdx);
            }
          }
        }

        const blob = new Blob([buffer], { type: 'application/octet-stream' });

        for (let i = 0; i < pixels.length; i += 4) {
          const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
          const val = gray > 128 ? 255 : 0;
          pixels[i] = val;
          pixels[i + 1] = val;
          pixels[i + 2] = val;
        }
        ctx.putImageData(imageData, 0, 0);
        const previewUrl = canvas.toDataURL('image/png');

        resolve({ blob, previewUrl, width, height });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const LogoSettings: React.FC<LogoSettingsProps> = ({ onBack }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [binBlob, setBinBlob] = useState<Blob | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loadingStored, setLoadingStored] = useState(true);
  const [storedLogo, setStoredLogo] = useState<{ dataUrl: string; width: number; height: number; bytes?: number } | null>(null);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load stored logo from device on mount
  useEffect(() => {
    const fetchStoredLogo = async () => {
      setLoadingStored(true);
      try {
        const result = await esp32Api.getLogo();
        setStoredLogo(result);
      } catch {
        setStoredLogo(null);
      } finally {
        setLoadingStored(false);
      }
    };
    fetchStoredLogo();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please select an image file", variant: "destructive" });
      return;
    }

    setProcessing(true);
    setUploadComplete(false);
    try {
      const { blob, previewUrl: preview, width, height } = await convertToMonoRasterBin(file);
      setBinBlob(blob);
      setPreviewUrl(preview);
      setDimensions({ width, height });
      const totalBytes = (width / 8) * height;
      toast({ title: "Image Processed", description: `Converted to ${width}×${height} raster bin (${totalBytes} bytes)` });
    } catch {
      toast({ title: "Processing Failed", description: "Failed to convert image", variant: "destructive" });
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setBinBlob(null);
    setDimensions(null);
    setUploadComplete(false);
  };

  const handleDeleteStoredLogo = async () => {
    setDeletingLogo(true);
    try {
      const result = await esp32Api.deleteLogo();
      if (result.success) {
        setStoredLogo(null);
        toast({ title: "Logo Deleted", description: "Logo removed from device successfully" });
      } else {
        toast({ title: "Delete Failed", description: result.error || "Failed to delete logo", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Delete Failed", description: error instanceof Error ? error.message : "Failed to delete logo", variant: "destructive" });
    } finally {
      setDeletingLogo(false);
    }
  };

  const handleUpload = async () => {
    if (!binBlob || !dimensions) {
      toast({ title: "No Logo", description: "Please upload a logo image first", variant: "destructive" });
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadComplete(false);

    try {
      const result = await esp32Api.uploadLogo(binBlob, dimensions.width, dimensions.height, (p) => {
        setProgress(p);
      });
      if (result.success) {
        setUploadComplete(true);
        // Refresh stored logo preview
        const stored = await esp32Api.getLogo();
        setStoredLogo(stored);
        toast({ title: "Logo Saved", description: "Logo uploaded to device successfully" });
      } else {
        toast({ title: "Upload Failed", description: result.error || "Failed to upload logo", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Upload Failed", description: error instanceof Error ? error.message : "Failed to upload logo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <PageContainer title="Logo Setting" showBack onBack={onBack}>
      <div className="space-y-4">

        {/* Stored Logo on Device */}
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-3">Current Logo on Device</h3>
          {loadingStored ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading stored logo...</span>
            </div>
          ) : storedLogo ? (
            <div className="space-y-3">
              <div className="border border-border rounded-lg p-4 bg-muted/30 flex items-center justify-center">
                <img
                  src={storedLogo.dataUrl}
                  alt="Stored logo on device"
                  className="max-w-full h-auto"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {storedLogo.width}×{storedLogo.height} · {formatFileSize(storedLogo.bytes ?? (Math.ceil(storedLogo.width / 8) * storedLogo.height))}
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteStoredLogo}
                disabled={deletingLogo}
              >
                {deletingLogo ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {deletingLogo ? 'Deleting...' : 'Delete Logo from Device'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <ImageIcon className="h-4 w-4" />
              <span className="text-sm">No logo stored on device</span>
            </div>
          )}
        </Card>

        {/* Upload New Logo */}
        <Card className="p-6">
          <h3 className="font-medium text-foreground mb-3">Upload New Logo</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              previewUrl
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {processing ? (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">Converting image...</p>
              </div>
            ) : previewUrl ? (
              <div className="space-y-3">
                <div className="border border-border rounded-lg p-4 bg-muted/30 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Logo preview (monochrome)"
                    className="max-w-full h-auto"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                {dimensions && (
                  <div>
                    <p className="font-medium text-foreground">
                      {dimensions.width}×{dimensions.height} monochrome raster
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize((dimensions.width / 8) * dimensions.height)}
                    </p>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Click to upload logo image</p>
                  <p className="text-sm text-muted-foreground">
                    Auto-converted to {MAX_WIDTH}px monochrome raster
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {uploading && (
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Uploading logo...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Do not disconnect the device during upload
              </p>
            </div>
          </Card>
        )}

        {uploadComplete && (
          <Card className="p-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-foreground">Upload Complete</p>
                <p className="text-sm text-muted-foreground">Logo saved to device successfully</p>
              </div>
            </div>
          </Card>
        )}

        <Button
          onClick={handleUpload}
          disabled={!binBlob || uploading}
          className="w-full py-6 bg-primary hover:bg-primary/90"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Upload Logo
            </>
          )}
        </Button>
      </div>
    </PageContainer>
  );
};

export default LogoSettings;

