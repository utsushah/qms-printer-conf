import React, { useState, useRef } from 'react';
import { ImageIcon, Upload, Trash2 } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
        // Scale to max width, ensure width is multiple of 8
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        // Round width up to multiple of 8
        width = Math.ceil(width / 8) * 8;

        // Draw to canvas and get pixel data
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

        // Convert to 1-bit raster: top-to-bottom, MSB first, black=1
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            const gray = pixels[srcIdx] * 0.299 + pixels[srcIdx + 1] * 0.587 + pixels[srcIdx + 2] * 0.114;
            // Threshold: <= 128 = black (bit=1), > 128 = white (bit=0)
            if (gray <= 128) {
              const byteIdx = y * widthBytes + Math.floor(x / 8);
              const bitIdx = 7 - (x % 8);
              buffer[byteIdx] |= (1 << bitIdx);
            }
          }
        }

        const blob = new Blob([buffer], { type: 'application/octet-stream' });

        // Generate monochrome preview on canvas
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
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please select an image file", variant: "destructive" });
      return;
    }

    setProcessing(true);
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
  };

  const handleSave = async () => {
    if (!binBlob || !dimensions) {
      toast({ title: "No Logo", description: "Please upload a logo image first", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await esp32Api.uploadLogo(binBlob, dimensions.width, dimensions.height);
      if (result.success) {
        toast({ title: "Logo Saved", description: "Logo uploaded to device successfully" });
      } else {
        toast({ title: "Upload Failed", description: result.error || "Failed to upload logo", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Upload Failed", description: error instanceof Error ? error.message : "Failed to upload logo", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Logo Setting" showBack onBack={onBack}>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Receipt Logo</h3>
              <p className="text-sm text-muted-foreground">
                Upload image — auto-converted to {MAX_WIDTH}px monochrome raster (.bin)
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {previewUrl ? (
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4 bg-muted/30 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Logo preview (monochrome)"
                  className="max-w-full h-auto"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Monochrome 1-bit raster preview{dimensions ? ` (${dimensions.width}×${dimensions.height}, ${(dimensions.width / 8) * dimensions.height} bytes)` : ''}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleRemove}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-32 border-dashed border-2 flex flex-col gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
            >
              {processing ? (
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-muted-foreground">Tap to upload logo image</span>
                </>
              )}
            </Button>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <SaveButton onClick={handleSave} loading={loading} />
      </div>
    </PageContainer>
  );
};

export default LogoSettings;
