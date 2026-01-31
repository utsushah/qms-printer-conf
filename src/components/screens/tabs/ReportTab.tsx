import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Radio, Clock, Timer, RotateCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { esp32Api, RemoteReportData } from '@/api/esp32';
import { toast } from '@/hooks/use-toast';

const ReportTab: React.FC = () => {
  const { settings } = useSettings();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<RemoteReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const remoteDevices = settings.manufacturing.remote.devices;

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const data = await esp32Api.getRemoteReport(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      setReportData(data);
    } catch (error) {
      toast({
        title: "Failed to load report",
        description: "Could not fetch report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await esp32Api.exportRemoteReport(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export report",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getDeviceReport = (remoteId: string): RemoteReportData | undefined => {
    return reportData.find(r => r.remoteId === remoteId);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Date Filter */}
      <Card className="p-4">
        <h3 className="font-medium text-foreground mb-4">Date Filter</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="text-sm text-muted-foreground mb-2 block">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="text-sm text-muted-foreground mb-2 block">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </Button>
        </div>
      </Card>

      {/* Remote Tiles */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RotateCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : remoteDevices.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No remote devices configured.</p>
          <p className="text-sm text-muted-foreground mt-2">Add devices in Manufacturing Settings.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {remoteDevices.map((device, index) => {
            const report = getDeviceReport(device.remoteId);
            return (
              <Card key={index} className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Radio className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {device.remoteId || `Device ${index + 1}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Service {device.serviceCode}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Waiting Time</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {report ? formatTime(report.waitingTime) : '--'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Serving Time</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {report ? formatTime(report.servingTime) : '--'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RotateCw className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Turnaround Time</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {report ? formatTime(report.turnaroundTime) : '--'}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportTab;
