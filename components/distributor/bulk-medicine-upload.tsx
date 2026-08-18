"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  File,
  FileJson,
  AlertTriangle,
  Info,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UploadResult {
  row: number
  medicineId?: number
  name?: string
  status: string
  message: string
}

interface UploadResponse {
  success: boolean
  totalRows: number
  successCount: number
  failureCount: number
  results: UploadResult[]
  /** Present only on a non-2xx response, where the body is an error envelope. */
  error?: string
}

export function BulkMedicineUpload() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<UploadResponse | null>(null)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const { toast } = useToast()

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const response = await fetch("/api/distributor/inventory/download-template")

      if (!response.ok) {
        toast({
          title: "Download failed",
          description: "Failed to download template",
          variant: "destructive",
        })
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `medicines_upload_template_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Template downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading template:", error)
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      })
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    const fileName = selectedFile.name.toLowerCase()
    if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV or XLSX file",
        variant: "destructive",
      })
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file first",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)

      const response = await fetch("/api/distributor/inventory/bulk-upload", {
        method: "POST",
        body: fd,
      })

      const data = (await response.json()) as UploadResponse

      if (!response.ok) {
        toast({
          title: "Upload failed",
          description: data.error || "Failed to upload file",
          variant: "destructive",
        })
        return
      }

      setUploadResults(data)
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${data.successCount} medicines (${data.failureCount} failed)`,
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "Something went wrong while uploading",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setUploadResults(null)
  }

  const handleClose = () => {
    setOpen(false)
    handleReset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Bulk Upload Medicines
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Medicines</DialogTitle>
          <DialogDescription>
            Upload multiple medicines at once using a CSV or XLSX file
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="guide">Guide</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            {uploadResults ? (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {uploadResults.successCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Successful</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {uploadResults.totalRows - uploadResults.successCount - uploadResults.failureCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Skipped</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {uploadResults.failureCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Failed</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Upload Progress</span>
                    <span className="text-muted-foreground">
                      {uploadResults.successCount} / {uploadResults.totalRows}
                    </span>
                  </div>
                  <Progress
                    value={
                      (uploadResults.successCount / uploadResults.totalRows) * 100
                    }
                  />
                </div>

                {/* Results Table */}
                <div className="border rounded-lg overflow-y-auto max-h-80">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadResults.results.map((result) => (
                        <TableRow key={`${result.row}-${result.medicineId}`}>
                          <TableCell className="text-sm">{result.row}</TableCell>
                          <TableCell className="text-sm font-medium">
                            {result.name || "-"}
                          </TableCell>
                          <TableCell>
                            {result.status === "success" && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Success
                              </Badge>
                            )}
                            {result.status === "error" && (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Error
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {result.message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                  >
                    Upload Another File
                  </Button>
                  <Button onClick={handleClose}>Done</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Drag and Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <div className="p-3 bg-muted rounded-full">
                        <File className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">
                        {file ? file.name : "Drag and drop your file here"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                    style={{
                      top: 0,
                      left: 0,
                      borderRadius: "0.5rem",
                    }}
                  />
                </div>

                {/* File Input (visible) */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Select File</label>
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="block w-full text-sm border border-input rounded-md p-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <p className="text-xs text-muted-foreground">
                    CSV, XLS, or XLSX files up to 10MB
                  </p>
                </div>

                {/* Alert */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Download the template below to ensure your file has all required columns in the correct format.
                  </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload File
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Template Tab */}
          <TabsContent value="template" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Download Template</CardTitle>
                <CardDescription>
                  Use this template to prepare your medicines data for bulk upload
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    The template includes example data. Remove these rows before uploading your actual medicines.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Template Includes:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>✓ All required column headers</li>
                    <li>✓ Proper date formats (DD-MM-YYYY)</li>
                    <li>✓ Example data for reference</li>
                    <li>✓ Column width optimization</li>
                  </ul>
                </div>

                <Button
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="w-full gap-2"
                >
                  {downloadingTemplate ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Excel Template
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guide Tab */}
          <TabsContent value="guide" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h3 className="font-medium mb-2">Column Requirements:</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">medicine_id</span> - Optional. If provided, it will be used to find the medicine.
                    </div>
                    <div>
                      <span className="font-medium text-foreground">medicine_name</span> - Required. Medicine name or generic name from our database.
                    </div>
                    <div>
                      <span className="font-medium text-foreground">generic_name</span> - Optional. Generic/IUPAC name.
                    </div>
                    <div>
                      <span className="font-medium text-foreground">strength</span> - Optional. e.g., &apos;500mg&apos;, &apos;10ml&apos;.
                    </div>
                    <div>
                      <span className="font-medium text-foreground">form</span> - Optional. e.g., &apos;tablet&apos;, &apos;capsule&apos;, &apos;syrup&apos;.
                    </div>
                    <div>
                      <span className="font-medium text-foreground">batch_number</span> - Required. Batch/Lot number.
                    </div>
                    <div>
                      <span className="font-medium text-foreground">mfg_date</span> - Optional. Manufacturing date (DD-MM-YYYY).
                    </div>
                    <div>
                      <span className="font-medium text-foreground">expiry_date</span> - Required. Expiry date (DD-MM-YYYY).
                    </div>
                    <div>
                      <span className="font-medium text-foreground">mrp</span> - Required. Maximum Retail Price.
                    </div>
                    <div>
                      <span className="font-medium text-foreground">quantity</span> - Required. Number of units.
                    </div>
                    <div>
                      <span className="font-medium text-foreground">unit_price</span> - Required. Your wholesale price per unit.
                    </div>
                    <div>
                      <span className="font-medium text-foreground">hsn_code</span> - Optional. HSN/SAC code for taxation.
                    </div>
                    <div>
                      <span className="font-medium text-foreground">notes</span> - Optional. Storage instructions or additional notes.
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Tips for Success:</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Use DD-MM-YYYY format for all dates</li>
                    <li>• Match medicine names exactly with our database</li>
                    <li>• Ensure all required fields are filled</li>
                    <li>• Maximum 2000 rows per upload</li>
                    <li>• File size limit: 10MB</li>
                    <li>• Duplicate entries by batch will update quantities</li>
                  </ul>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    If a medicine already exists in your inventory for the same batch, the quantity will be updated instead of creating a duplicate entry.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
