import React, { useState, useRef } from 'react';
import { Upload, FileArchive, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

interface SoftwareUpdateProps {
  onBack: () => void;
}

const SoftwareUpdate: React.FC<SoftwareUpdateProps> = ({ onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateComplete, setUpdateComplete] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.bin')) {
        toast({
          title: "Invalid File",
          description: "Please select a .bin firmware file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setUpdateComplete(false);
    }
  };

  const handleUpdate = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a firmware file first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUpdateComplete(true);
          toast({
            title: "Update Complete",
            description: "Firmware updated successfully. Device will restart.",
          });
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <PageContainer title="Software Update" showBack onBack={onBack}>
      <div className="space-y-4">
        <Card className="p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".bin"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              selectedFile 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <FileArchive className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Click to upload firmware</p>
                  <p className="text-sm text-muted-foreground">Only .bin files are supported</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {uploading && (
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Uploading firmware...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Do not disconnect the device during update
              </p>
            </div>
          </Card>
        )}

        {updateComplete && (
          <Card className="p-4 border-success/30 bg-success/5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <div>
                <p className="font-medium text-foreground">Update Complete</p>
                <p className="text-sm text-muted-foreground">Device will restart automatically</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Important</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• Ensure stable power during update</li>
                <li>• Do not disconnect the device</li>
                <li>• Device will restart after update</li>
              </ul>
            </div>
          </div>
        </Card>

        <Button 
          onClick={handleUpdate}
          disabled={!selectedFile || uploading}
          className="w-full py-6 bg-primary hover:bg-primary/90"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Update Firmware
            </>
          )}
        </Button>
      </div>
    </PageContainer>
  );
};

export default SoftwareUpdate;
