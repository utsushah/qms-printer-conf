import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Radio, Clock, Timer, RotateCw, Hash, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { esp32Api, RemoteReportData } from '@/api/esp32';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

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
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Create data array with header row
      const excelData: any[][] = [];
      
      // Row 1: eQueue header
      excelData.push(['eQueue', '', '', '', '', '', '', '']);
      
      // Row 2: Column headers
      excelData.push(['Date', 'Remote ID', 'Service Code', 'Current Token', 'Issued Tokens', 'Waiting Time', 'Serving Time', 'Turnaround Time']);
      
      // Data rows
      if (reportData.length > 0) {
        reportData.forEach(row => {
          excelData.push([
            row.date,
            row.remoteId,
            row.serviceCode,
            row.currentToken ?? 0,
            row.issuedTokens ?? 0,
            formatTime(row.waitingTime),
            formatTime(row.servingTime),
            formatTime(row.turnaroundTime)
          ]);
        });
      } else {
        // If no data, create empty rows for each device
        remoteDevices.forEach(device => {
          excelData.push([
            format(startDate, 'yyyy-MM-dd'),
            device.remoteId,
            device.serviceCode,
            0,
            0,
            '0m 0s',
            '0m 0s',
            '0m 0s'
          ]);
        });
      }
      
      // Create worksheet from array
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // Merge eQueue header across columns A-H
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
      
      // Auto-size columns
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 12 }, // Remote ID
        { wch: 14 }, // Service Code
        { wch: 14 }, // Current Token
        { wch: 14 }, // Issued Tokens
        { wch: 14 }, // Waiting Time
        { wch: 14 }, // Serving Time
        { wch: 16 }, // Turnaround Time
      ];
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      
      // Generate Excel file and download
      XLSX.writeFile(workbook, `report_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}.xlsx`);
      
      toast({
        title: "Export Successful",
        description: "Report has been downloaded as Excel file",
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

  // Calculate averages for a specific remote device
  const getDeviceAverages = (remoteId: string) => {
    const deviceData = reportData.filter(r => r.remoteId === remoteId);
    if (deviceData.length === 0) return null;
    
    const avgWaitingTime = Math.round(deviceData.reduce((sum, r) => sum + r.waitingTime, 0) / deviceData.length);
    const avgServingTime = Math.round(deviceData.reduce((sum, r) => sum + r.servingTime, 0) / deviceData.length);
    const avgTurnaroundTime = Math.round(deviceData.reduce((sum, r) => sum + r.turnaroundTime, 0) / deviceData.length);
    
    // Get latest values for current token and issued tokens (most recent date)
    const sortedData = [...deviceData].sort((a, b) => b.date.localeCompare(a.date));
    const latestData = sortedData[0];
    
    // Sum issued tokens across all dates
    const totalIssuedTokens = deviceData.reduce((sum, r) => sum + (r.issuedTokens ?? 0), 0);
    
    return {
      currentToken: latestData?.currentToken,
      issuedTokens: totalIssuedTokens,
      avgWaitingTime,
      avgServingTime,
      avgTurnaroundTime
    };
  };

  return (
    <div className="p-4 space-y-4">
      {/* Date Filter */}
      <Card className="p-4">
        <h3 className="font-medium text-foreground mb-4">Date Filter</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-xs sm:text-sm",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{startDate ? format(startDate, "PP") : "Pick a date"}</span>
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

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-xs sm:text-sm",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{endDate ? format(endDate, "PP") : "Pick a date"}</span>
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
        </div>
        <div className="mt-3">
          <Button onClick={handleExport} disabled={exporting} className="gap-2 w-full sm:w-auto">
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
            const averages = getDeviceAverages(device.remoteId);
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
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Current Token</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {averages?.currentToken ?? '--'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Issued Tokens</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {averages?.issuedTokens ?? '--'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Avg Waiting Time</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {averages ? formatTime(averages.avgWaitingTime) : '--'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Avg Serving Time</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {averages ? formatTime(averages.avgServingTime) : '--'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RotateCw className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Avg Turnaround Time</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {averages ? formatTime(averages.avgTurnaroundTime) : '--'}
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
