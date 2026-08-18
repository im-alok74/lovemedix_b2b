"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface Medicine {
  id: number
  name: string
  generic_name: string
  manufacturer: string
  form: string
  strength: string
  pack_size?: string
  mrp: number
  description?: string
  image_url?: string
  source: string
}

interface UploadResult {
  medicineId: number
  name: string
  status: string
  message: string
  id?: number
}

const FORM_OPTIONS = [
  { value: "", label: "All Forms" },
  { value: "tablet", label: "Tablet" },
  { value: "capsule", label: "Capsule" },
  { value: "syrup", label: "Syrup" },
  { value: "injection", label: "Injection" },
  { value: "cream", label: "Cream" },
  { value: "drops", label: "Drops" },
  { value: "inhaler", label: "Inhaler" },
  { value: "other", label: "Other" },
]

export function BrowseAndUploadMedicines() {
  const [open, setOpen] = useState(false)
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [selectedMedicines, setSelectedMedicines] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [formFilter, setFormFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<UploadResult[] | null>(null)
  const { toast } = useToast()

  // Fetch medicines from database
  const fetchMedicines = async (page = 1, search = "", form = "") => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...(search && { search }),
        ...(form && { form }),
      })

      const response = await fetch(`/api/distributor/medicines/upload-from-database?${params}`)
      const data = await response.json()

      if (response.ok) {
        setMedicines(data.medicines)
        setTotalPages(data.pagination.pages)
        setCurrentPage(page)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch medicines",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching medicines:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (open) {
      fetchMedicines(1, searchTerm, formFilter)
    }
  }, [open])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchMedicines(1, searchTerm, formFilter)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMedicines(new Set(medicines.map((m) => m.id)))
    } else {
      setSelectedMedicines(new Set())
    }
  }

  const handleSelectMedicine = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedMedicines)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedMedicines(newSelected)
  }

  const handleUpload = async () => {
    if (selectedMedicines.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one medicine",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const response = await fetch("/api/distributor/medicines/upload-from-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineIds: Array.from(selectedMedicines),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setUploadResults(data.results)
        toast({
          title: "Success",
          description: `${data.successCount} medicines added to your inventory`,
        })
        setTimeout(() => {
          setOpen(false)
          setSelectedMedicines(new Set())
          setUploadResults(null)
        }, 2000)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to upload medicines",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading medicines:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleUploadAll = async () => {
    setUploading(true)
    try {
      const response = await fetch("/api/distributor/medicines/upload-from-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectAll: true }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || `Uploaded ${data.successCount} medicines to your inventory`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to upload medicines",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading all medicines:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast({
        title: "No file selected",
        description: "Please choose a CSV/XLSX file first.",
        variant: "destructive",
      })
      return
    }

    setBulkUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", bulkFile)

      const response = await fetch("/api/distributor/inventory/bulk-upload", {
        method: "POST",
        body: fd,
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Upload failed",
          description: data.error || "Failed to upload bulk file",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Bulk upload complete",
        description: `Success: ${data.successCount}, Failed: ${data.failureCount}`,
      })

      setBulkFile(null)
      fetchMedicines(currentPage, searchTerm, formFilter)
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Something went wrong while uploading file",
        variant: "destructive",
      })
    } finally {
      setBulkUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2" variant="outline">
            <Download className="h-4 w-4" />
            Browse Database
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Medicines from Database</DialogTitle>
          <DialogDescription>
            Browse and select medicines from our database to add to your inventory
          </DialogDescription>
        </DialogHeader>

        {uploadResults ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {uploadResults.filter((r) => r.status === "success").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Successful</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {uploadResults.filter((r) => r.status === "already_exists").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Already in Inventory</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {uploadResults.filter((r) => r.status === "error").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadResults.map((result) => (
                    <TableRow key={result.medicineId}>
                      <TableCell className="font-medium">{result.name}</TableCell>
                      <TableCell>
                        {result.status === "success" && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        )}
                        {result.status === "already_exists" && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Exists
                          </Badge>
                        )}
                        {result.status === "error" && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
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

            <Button onClick={() => setOpen(false)} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="space-y-4 border-b pb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSearch()
                  }}
                  disabled={loading}
                />
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>

              <div>
                <Label className="text-sm">Medicine Form</Label>
                <select
                  value={formFilter}
                  onChange={(e) => setFormFilter(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  {FORM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-md border border-border p-3">
                <p className="mb-2 text-sm font-medium">Optional Bulk Upload (CSV/XLSX)</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                    disabled={bulkUploading}
                  />
                  <Button
                    type="button"
                    onClick={handleBulkUpload}
                    disabled={!bulkFile || bulkUploading}
                    className="gap-2"
                  >
                    {bulkUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Upload File
                      </>
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Columns supported: medicine_id or medicine_name, strength, batch_number, expiry_date, mrp, quantity, unit_price.
                </p>
              </div>
            </div>

            {/* Medicines List */}
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-12">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={
                            medicines.length > 0 &&
                            selectedMedicines.size === medicines.length
                          }
                          onCheckedChange={handleSelectAll}
                          disabled={loading || medicines.length === 0}
                        />
                      </div>
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Generic</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No medicines found
                      </TableCell>
                    </TableRow>
                  ) : (
                    medicines.map((medicine) => (
                      <TableRow key={medicine.id}>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedMedicines.has(medicine.id)}
                              onCheckedChange={(checked) =>
                                handleSelectMedicine(medicine.id, checked as boolean)
                              }
                              disabled={loading}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{medicine.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {medicine.generic_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{medicine.form}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{medicine.strength}</TableCell>
                        <TableCell className="text-right font-medium">
                            ₹{(Number(medicine.mrp) || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fetchMedicines(currentPage - 1, searchTerm, formFilter)}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fetchMedicines(currentPage + 1, searchTerm, formFilter)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center border-t pt-4">
              <div className="text-sm">
                {selectedMedicines.size} of {medicines.length} selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={selectedMedicines.size === 0 || uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Upload {selectedMedicines.size} Medicine{selectedMedicines.size !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

      <Button onClick={handleUploadAll} disabled={uploading} className="gap-2">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Upload All Medicines
      </Button>
    </div>
  )
}
