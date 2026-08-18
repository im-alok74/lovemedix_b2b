'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Search, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"

interface OutOfStockRequest {
  id: number
  pharmacy_id: number
  medicine_id: number
  requested_quantity: number
  mrp: string | number
  unit_price: string | number
  status: string
  notes: string | null
  created_at: string
  fulfilled_at: string | null
  pharmacy_name: string
  pharmacy_contact: string
  pharmacy_phone: string
  pharmacy_email: string
  medicine_name: string
  generic_name: string
  manufacturer: string
  batch_number: string | null
  expiry_date: string | null
  available_quantity: number | null
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  fulfilled: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <AlertCircle className="w-4 h-4" />,
  assigned: <Clock className="w-4 h-4" />,
  fulfilled: <CheckCircle2 className="w-4 h-4" />,
  rejected: <AlertCircle className="w-4 h-4" />,
}

export function DistributorOutOfStockRequests() {
  const [requests, setRequests] = useState<OutOfStockRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<OutOfStockRequest | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showFulfillDialog, setShowFulfillDialog] = useState(false)
  const [quantityOffered, setQuantityOffered] = useState("")
  const [fulfillmentNotes, setFulfillmentNotes] = useState("")
  const [isFulfilling, setIsFulfilling] = useState(false)
  const { toast } = useToast()

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", currentPage.toString())
      params.set("pageSize", "15")

      const response = await fetch(
        `/api/distributor/out-of-stock-requests?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      )

      const data = await response.json()

      if (response.ok) {
        setRequests(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch requests",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFulfill = async () => {
    if (!selectedRequest || !quantityOffered) {
      toast({
        title: "Error",
        description: "Please enter the quantity you can offer",
        variant: "destructive",
      })
      return
    }

    const qty = parseInt(quantityOffered)
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      })
      return
    }

    if (
      selectedRequest.available_quantity &&
      qty > selectedRequest.available_quantity
    ) {
      toast({
        title: "Error",
        description: `You only have ${selectedRequest.available_quantity} units available`,
        variant: "destructive",
      })
      return
    }

    setIsFulfilling(true)
    try {
      const response = await fetch(
        `/api/distributor/out-of-stock-requests/${selectedRequest.id}/fulfill`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            quantity_offered: qty,
            notes: fulfillmentNotes || null,
          }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Request fulfilled",
          description: "The pharmacy will receive their order automatically",
        })
        setShowFulfillDialog(false)
        setQuantityOffered("")
        setFulfillmentNotes("")
        setShowDetails(false)
        fetchRequests()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fulfill request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fulfilling request:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsFulfilling(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [currentPage])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            Loading requests...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No out-of-stock requests</p>
            <p className="text-sm mt-1">
              When pharmacies request medicines that are out of stock, you&apos;ll see them here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Out-of-Stock Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pharmacy</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Quantity Needed</TableHead>
                  <TableHead>You Have</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.pharmacy_name}</TableCell>
                    <TableCell>{req.medicine_name}</TableCell>
                    <TableCell>{req.requested_quantity}</TableCell>
                    <TableCell className="text-sm">
                      {req.available_quantity || "0"} units
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[req.status]}>
                        <span className="flex items-center gap-1">
                          {statusIcons[req.status]}
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(req.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(req)
                          setShowDetails(true)
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Pharmacy Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pharmacy</p>
                  <p className="font-medium">{selectedRequest.pharmacy_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.pharmacy_contact}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.pharmacy_phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedRequest.status]}>
                    {selectedRequest.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Medicine Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Medicine</p>
                  <p className="font-medium">{selectedRequest.medicine_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.generic_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.manufacturer}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Batch & Expiry</p>
                  <p className="font-medium text-sm">{selectedRequest.batch_number || "—"}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.expiry_date
                      ? new Date(selectedRequest.expiry_date).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Quantity & Pricing */}
              <div className="grid grid-cols-3 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requested</p>
                  <p className="font-medium text-lg">{selectedRequest.requested_quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">You Have</p>
                  <p className="font-medium text-lg">{selectedRequest.available_quantity || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unit Price</p>
                  <p className="font-medium">₹{selectedRequest.unit_price}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="pb-4 border-b">
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <DialogFooter className="flex gap-2 pt-4">
                {(selectedRequest.status === "pending" ||
                  selectedRequest.status === "assigned") && (
                  <Button
                    variant="default"
                    onClick={() => setShowFulfillDialog(true)}
                  >
                    Fulfill Request
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fulfillment Dialog */}
      <Dialog open={showFulfillDialog} onOpenChange={setShowFulfillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fulfill Out-of-Stock Request</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-sm font-medium">{selectedRequest.medicine_name}</p>
                <p className="text-sm text-muted-foreground">
                  Pharmacy needs {selectedRequest.requested_quantity} units
                </p>
                <p className="text-sm text-muted-foreground">
                  You have {selectedRequest.available_quantity || 0} units available
                </p>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity to Offer</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedRequest.available_quantity || 0}
                  value={quantityOffered}
                  onChange={(e) => setQuantityOffered(e.target.value)}
                  placeholder="Enter quantity you can provide"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum: {selectedRequest.available_quantity || 0} units
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Delivery in 2 days, special instructions..."
                  value={fulfillmentNotes}
                  onChange={(e) => setFulfillmentNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFulfillDialog(false)
                    setQuantityOffered("")
                    setFulfillmentNotes("")
                  }}
                  disabled={isFulfilling}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFulfill}
                  disabled={isFulfilling || !quantityOffered}
                >
                  {isFulfilling ? "Fulfilling..." : "Confirm Fulfillment"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
