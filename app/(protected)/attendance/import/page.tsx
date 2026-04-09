"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { Upload, FileText, Download, Edit3, Eye, Loader2, Camera, X, RefreshCw } from "lucide-react";
import { extractTextFromImage } from "@/lib/vision";
import { parseAttendanceData, calculateHours, calculateOvertime } from "@/lib/attendance-parser";

interface AttendanceRecord {
  id: string;
  name: string;
  date: string | null;
  inTime: string;
  outTime: string;
  totalHours?: number;
  overtime?: number;
}

interface ProcessedImage {
  file: File;
  preview: string;
  ocrText?: string;
  extractedData?: AttendanceRecord[];
}

export default function ImportAttendancePage() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<AttendanceRecord>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: ProcessedImage[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  // Native camera capture
  const handleCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const newImages: ProcessedImage[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setImages(prev => [...prev, ...newImages]);
    toast.success(`Photo${files.length > 1 ? 's' : ''} captured successfully!`);
    
    // Reset the input value to allow capturing the same photo again
    e.target.value = '';
  }, []);

  const processImages = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsProcessing(true);
    
    try {
      const processedImages = await Promise.all(
        images.map(async (image) => {
          // Step 1: OCR with Google Vision API
          const ocrText = await extractTextFromImage(image.file);
          
          // Step 2: Parse with AI
          const extractedData = await parseAttendanceData(ocrText);
          
          // Step 3: Calculate hours and overtime
          const processedData = extractedData.map(record => ({
            ...record,
            totalHours: calculateHours(record.inTime, record.outTime),
            overtime: calculateOvertime(record.inTime, record.outTime)
          }));

          return {
            ...image,
            ocrText,
            extractedData: processedData
          };
        })
      );

      setImages(processedImages);
      toast.success("Images processed successfully!");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Failed to process images. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  
  const startEditing = (recordId: string, record: AttendanceRecord) => {
    setEditingRecord(recordId);
    setEditValues(record);
  };

  const saveEdit = (imageIndex: number, recordId: string) => {
    setImages(prev => {
      const newImages = [...prev];
      const recordIndex = newImages[imageIndex].extractedData?.findIndex(r => r.id === recordId);
      if (recordIndex !== undefined && recordIndex !== -1) {
        newImages[imageIndex].extractedData![recordIndex] = {
          ...newImages[imageIndex].extractedData![recordIndex],
          ...editValues,
          totalHours: calculateHours(editValues.inTime || '', editValues.outTime || ''),
          overtime: calculateOvertime(editValues.inTime || '', editValues.outTime || '')
        };
      }
      return newImages;
    });
    setEditingRecord(null);
    setEditValues({});
    toast.success("Record updated successfully!");
  };

  const exportToExcel = async () => {
    const allRecords = images.flatMap(img => img.extractedData || []);
    
    if (allRecords.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Import');

      // Add headers
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'In Time', key: 'inTime', width: 12 },
        { header: 'Out Time', key: 'outTime', width: 12 },
        { header: 'Total Hours', key: 'totalHours', width: 12 },
        { header: 'Overtime', key: 'overtime', width: 12 }
      ];

      // Add data
      allRecords.forEach(record => {
        worksheet.addRow({
          name: record.name,
          date: record.date || '',
          inTime: record.inTime,
          outTime: record.outTime,
          totalHours: record.totalHours?.toFixed(2) || '0',
          overtime: record.overtime?.toFixed(2) || '0'
        });
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Download file
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-import-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel file");
    }
  };

  const allRecords = images.flatMap(img => img.extractedData || []);

  
  const mainContent = (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Import Attendance</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Upload attendance register images to extract and convert data
          </p>
        </div>
        {allRecords.length > 0 && (
          <Button onClick={exportToExcel} className="gap-2">
            <Download className="w-4 h-4" />
            Export to Excel
          </Button>
        )}
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop: Only Upload */}
          <div className="hidden md:block border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center min-h-[200px]">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer inline-flex flex-col items-center gap-3 w-full h-full justify-center hover:bg-muted-foreground/5 rounded-lg transition-colors p-4"
            >
              <Upload className="w-12 h-12 text-muted-foreground" />
              <div>
                <span className="text-lg font-medium block">Upload Images</span>
                <span className="text-sm text-muted-foreground block mt-1">
                  Click or drag & drop files here
                </span>
              </div>
            </label>
          </div>

          {/* Mobile: Upload + Camera */}
          <div className="md:hidden space-y-4">
            {/* Upload - Mobile */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center min-h-[200px]">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload-mobile"
              />
              <label
                htmlFor="image-upload-mobile"
                className="cursor-pointer inline-flex flex-col items-center gap-3 w-full h-full justify-center hover:bg-muted-foreground/5 rounded-lg transition-colors p-4"
              >
                <Upload className="w-12 h-12 text-muted-foreground" />
                <div>
                  <span className="text-lg font-medium block">Upload Images</span>
                  <span className="text-sm text-muted-foreground block mt-1">
                    Click or drag & drop
                  </span>
                </div>
              </label>
            </div>

            {/* Camera - Mobile Only */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center min-h-[200px]">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
                id="camera-capture"
              />
              <label
                htmlFor="camera-capture"
                className="cursor-pointer inline-flex flex-col items-center gap-3 w-full h-full justify-center hover:bg-muted-foreground/5 rounded-lg transition-colors p-4"
              >
                <Camera className="w-12 h-12 text-muted-foreground" />
                <div>
                  <span className="text-lg font-medium block">Take Photo</span>
                  <span className="text-sm text-muted-foreground block mt-1">
                    Click to open camera app
                  </span>
                </div>
              </label>
            </div>
          </div>

          {images.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{images.length} image(s) uploaded</span>
                <Button
                  onClick={processImages}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Extract Text & Process
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full cursor-pointer h-24 object-cover rounded border"
                      onClick={() => setPreviewImage(image.preview)}
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 cursor-pointer right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {image.extractedData && (
                      <Badge className="absolute bottom-1 left-1 text-xs" variant="secondary">
                        {image.extractedData.length} records
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {allRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Extracted Attendance Data ({allRecords.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>In Time</TableHead>
                    <TableHead>Out Time</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {editingRecord === record.id ? (
                          <Input
                            value={editValues.name || ''}
                            onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full"
                          />
                        ) : (
                          record.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingRecord === record.id ? (
                          <Input
                            value={editValues.date || ''}
                            onChange={(e) => setEditValues(prev => ({ ...prev, date: e.target.value }))}
                            placeholder="YYYY-MM-DD"
                            className="w-full"
                          />
                        ) : (
                          record.date || 'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingRecord === record.id ? (
                          <Input
                            value={editValues.inTime || ''}
                            onChange={(e) => setEditValues(prev => ({ ...prev, inTime: e.target.value }))}
                            placeholder="HH:MM"
                            className="w-full"
                          />
                        ) : (
                          record.inTime
                        )}
                      </TableCell>
                      <TableCell>
                        {editingRecord === record.id ? (
                          <Input
                            value={editValues.outTime || ''}
                            onChange={(e) => setEditValues(prev => ({ ...prev, outTime: e.target.value }))}
                            placeholder="HH:MM"
                            className="w-full"
                          />
                        ) : (
                          record.outTime
                        )}
                      </TableCell>
                      <TableCell>{record.totalHours?.toFixed(2) || '0.00'}h</TableCell>
                      <TableCell>{record.overtime?.toFixed(2) || '0.00'}h</TableCell>
                      <TableCell>
                        {editingRecord === record.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const imageIndex = images.findIndex(img =>
                                  img.extractedData?.some(r => r.id === record.id)
                                );
                                if (imageIndex !== -1) {
                                  saveEdit(imageIndex, record.id);
                                }
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingRecord(null);
                                setEditValues({});
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(record.id, record)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Image Preview Modal
  if (previewImage) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={() => setPreviewImage(null)}
      >
        <div className="relative max-w-4xl max-h-full">
          <img
            src={previewImage || ''}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  }

  return mainContent;
}
