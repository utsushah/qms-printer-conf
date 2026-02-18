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
 * Converts an image file to a 320px max-width, BMP monochrome (1-bit per pixel) ArrayBuffer.
 */
const convertToMonochromeBmp = async (file: File): Promise<{ blob: Blob; previewUrl: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        // Scale to max 320px width
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

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

        // Convert to 1-bit monochrome using threshold
        const rowBytes = Math.ceil(width / 32) * 4; // BMP rows are padded to 4 bytes
        const pixelDataSize = rowBytes * height;

        // BMP file structure
        const fileHeaderSize = 14;
        const infoHeaderSize = 40;
        const paletteSize = 8; // 2 colors × 4 bytes
        const fileSize = fileHeaderSize + infoHeaderSize + paletteSize + pixelDataSize;

        const buffer = new ArrayBuffer(fileSize);
        const view = new DataView(buffer);

        // BMP File Header (14 bytes)
        view.setUint8(0, 0x42); // 'B'
        view.setUint8(1, 0x4D); // 'M'
        view.setUint32(2, fileSize, true);
        view.setUint32(6, 0, true); // Reserved
        view.setUint32(10, fileHeaderSize + infoHeaderSize + paletteSize, true); // Pixel data offset

        // BMP Info Header (40 bytes)
        view.setUint32(14, infoHeaderSize, true);
        view.setInt32(18, width, true);
        view.setInt32(22, height, true); // Positive = bottom-up
        view.setUint16(26, 1, true); // Planes
        view.setUint16(28, 1, true); // 1 bit per pixel
        view.setUint32(30, 0, true); // No compression
        view.setUint32(34, pixelDataSize, true);
        view.setUint32(38, 2835, true); // X pixels per meter (72 DPI)
        view.setUint32(42, 2835, true); // Y pixels per meter
        view.setUint32(46, 2, true); // Colors used
        view.setUint32(50, 2, true); // Important colors

        // Color palette: Black (index 0), White (index 1)
        const paletteOffset = fileHeaderSize + infoHeaderSize;
        // Black: B=0, G=0, R=0, A=0
        view.setUint32(paletteOffset, 0x00000000, true);
        // White: B=FF, G=FF, R=FF, A=0
        view.setUint8(paletteOffset + 4, 0xFF);
        view.setUint8(paletteOffset + 5, 0xFF);
        view.setUint8(paletteOffset + 6, 0xFF);
        view.setUint8(paletteOffset + 7, 0x00);

        // Pixel data (bottom-up, 1-bit)
        const dataOffset = paletteOffset + paletteSize;
        for (let y = 0; y < height; y++) {
          const bmpRow = height - 1 - y; // BMP is bottom-up
          for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            const gray = pixels[srcIdx] * 0.299 + pixels[srcIdx + 1] * 0.587 + pixels[srcIdx + 2] * 0.114;
            // Threshold: > 128 = white (1), else black (0)
            if (gray > 128) {
              const byteIdx = dataOffset + bmpRow * rowBytes + Math.floor(x / 8);
              const bitIdx = 7 - (x % 8);
              view.setUint8(byteIdx, view.getUint8(byteIdx) | (1 << bitIdx));
            }
          }
        }

        const blob = new Blob([buffer], { type: 'image/bmp' });

        // Generate preview from the threshold canvas
        for (let i = 0; i < pixels.length; i += 4) {
          const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
          const val = gray > 128 ? 255 : 0;
          pixels[i] = val;
          pixels[i + 1] = val;
          pixels[i + 2] = val;
        }
        ctx.putImageData(imageData, 0, 0);
        const previewUrl = canvas.toDataURL('image/png');

        resolve({ blob, previewUrl });
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
  const [bmpBlob, setBmpBlob] = useState<Blob | null>(null);
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
      const { blob, previewUrl: preview } = await convertToMonochromeBmp(file);
      setBmpBlob(blob);
      setPreviewUrl(preview);
      toast({ title: "Image Processed", description: `Converted to ${MAX_WIDTH}px monochrome BMP` });
    } catch {
      toast({ title: "Processing Failed", description: "Failed to convert image", variant: "destructive" });
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setBmpBlob(null);
  };

  const handleSave = async () => {
    if (!bmpBlob) {
      toast({ title: "No Logo", description: "Please upload a logo image first", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await esp32Api.uploadLogo(bmpBlob);
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
                Upload image — auto-converted to {MAX_WIDTH}px monochrome BMP
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
                Monochrome 1-bit BMP preview ({MAX_WIDTH}px max width)
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
