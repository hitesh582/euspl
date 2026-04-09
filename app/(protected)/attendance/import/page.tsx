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
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Camera functions
  const getCameraDevices = useCallback(async () => {
    try {
      // First check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        toast.error('Camera API not available in this browser');
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(videoDevices);
      
      // Auto-select first camera if none selected
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      toast.error(`Failed to access camera devices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedCamera]);

  const startCamera = useCallback(async () => {
    setIsCameraLoading(true);
    try {
      // First try with basic constraints
      let constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      // If we have a selected camera, try to use it
      if (selectedCamera) {
        constraints = {
          video: {
            deviceId: { exact: selectedCamera },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      }

      // Show camera modal first
      setShowCamera(true);
      
      // Try to get media stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      
      // Use setTimeout to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            toast.success('Camera started successfully');
          };
        } else {
          toast.error('Failed to initialize video element');
          setShowCamera(false);
        }
      }, 100);
      
    } catch (error) {
      // Provide specific error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          toast.error('No camera found. Please connect a camera device.');
        } else if (error.name === 'NotReadableError') {
          toast.error('Camera is already in use by another application.');
        } else {
          toast.error(`Camera error: ${error.message}`);
        }
      } else {
        toast.error('Failed to start camera. Please check permissions.');
      }
      setShowCamera(false);
    } finally {
      setIsCameraLoading(false);
    }
  }, [selectedCamera]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const newImage: ProcessedImage = {
              file,
              preview: URL.createObjectURL(file)
            };
            setImages(prev => [...prev, newImage]);
            toast.success('Photo captured successfully!');
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  }, [stopCamera]);

  const switchCamera = useCallback(async () => {
    const currentIndex = cameraDevices.findIndex(device => device.deviceId === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameraDevices.length;
    const nextCamera = cameraDevices[nextIndex];
    
    setSelectedCamera(nextCamera.deviceId);
    
    if (showCamera) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [cameraDevices, selectedCamera, showCamera, stopCamera, startCamera]);

  // Initialize camera devices on mount
  useEffect(() => {
    getCameraDevices();
    
    // Listen for device changes
    const handleDeviceChange = () => {
      getCameraDevices();
    };
    
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [getCameraDevices]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

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

  // Camera Modal
  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Camera Capture</h3>
            <div className="flex items-center gap-2">
              {cameraDevices.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchCamera}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Switch Camera
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={stopCamera}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Close
              </Button>
            </div>
          </div>
          
          <div className="relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full max-h-[60vh] object-contain"
            />
            
            {/* Camera controls overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
              <Button
                onClick={capturePhoto}
                size="lg"
                className="bg-white text-black hover:bg-gray-100 rounded-full w-16 h-16 p-0"
              >
                <div className="w-14 h-14 bg-black rounded-full"></div>
              </Button>
            </div>
            
            {/* Camera info overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
              {cameraDevices.find(d => d.deviceId === selectedCamera)?.label || 'Camera'}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 text-center text-sm text-muted-foreground">
            Position the attendance register in view and tap the button to capture
          </div>
        </div>
      </div>
    );
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center h-full min-h-[200px] flex flex-col justify-center">
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
                    Click or drag & drop
                  </span>
                </div>
              </label>
            </div>

            {/* Camera Capture */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center h-full min-h-[200px] flex flex-col justify-center">
              <button
                onClick={startCamera}
                disabled={isCameraLoading || cameraDevices.length === 0}
                className="cursor-pointer inline-flex flex-col items-center gap-3 w-full h-full justify-center hover:bg-muted-foreground/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-4"
              >
                <Camera className="w-12 h-12 text-muted-foreground" />
                <div>
                  <span className="text-lg font-medium block">Take Photo</span>
                  <span className="text-sm text-muted-foreground block mt-1">
                    {cameraDevices.length === 0 
                      ? 'No camera available' 
                      : `Click to open camera (${cameraDevices.length} found)`
                    }
                  </span>
                </div>
              </button>
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
      <>
        <canvas ref={canvasRef} className="hidden" />
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
      </>
    );
  }

  // Hidden canvas for photo capture
  return (
    <>
      {mainContent}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
