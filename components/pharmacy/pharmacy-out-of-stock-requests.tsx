'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CheckCircle2, Clock, XCircle, AlertCircle, Loader2, X } from "lucide-react"

interface OutOfStockRequest {
  id: number
  distributor_id: number
  medicine_id: number
  requested_quantity: number
  mrp: string | number
  unit_price: string | number
  status: string
  notes: string | null
  created_at: string
  fulfilled_at: string | null
  distributor_name: string | null
  medicine_name: string
  generic_name: string
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  fulfilled: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  assigned: <AlertCircle className="w-4 h-4" />,
  fulfilled: <CheckCircle2 className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
}

export function PharmacyOutOfStockRequests() {
  const [requests, setRequests] = useState<OutOfStockRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<OutOfStockRequest | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const { toast } = useToast()

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/pharmacy/out-of-stock-requests", {
        credentials: "include",
        cache: "no-store",
      })

      const data = await response.json()

      if (response.ok) {
        setRequests(data.data || [])
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

  const handleCancelRequest = async (id: number) => {
    setIsCancelling(true)
    try {
      const response = await fetch(`/api/pharmacy/out-of-stock-requests/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Request cancelled",
          description: "Your request has been cancelled",
        })
        setShowDetails(false)
        fetchRequests()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to cancel request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error cancelling request:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

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
            <p>No medicine requests yet</p>
            <p className="text-sm mt-1">
              Requested medicines will appear here for you, the admin, and the distributor
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
      <Card>
      <CardHeader>
        <CardTitle>Medicine Requests ({requests.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Distributor</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.medicine_name}</TableCell>
                  <TableCell>{req.distributor_name || "—"}</TableCell>
                  <TableCell>{req.requested_quantity}</TableCell>
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
      </CardContent>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medicine</p>
                <p className="font-medium">{selectedRequest.medicine_name}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.generic_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Distributor</p>
                  <p className="font-medium">{selectedRequest.distributor_name || "Pending Assignment"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedRequest.status]}>
                    {selectedRequest.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quantity Requested</p>
                  <p className="font-medium text-lg">{selectedRequest.requested_quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unit Price</p>
                  <p className="font-medium">₹{selectedRequest.unit_price}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Requested Date</p>
                <p className="text-sm">
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </p>
              </div>

              {selectedRequest.fulfilled_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fulfilled Date</p>
                  <p className="text-sm">
                    {new Date(selectedRequest.fulfilled_at).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedRequest.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}

              <DialogFooter className="flex gap-2">
                {selectedRequest.status === "pending" && (
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelRequest(selectedRequest.id)}
                    disabled={isCancelling}
                  >
                    {isCancelling ? "Cancelling..." : "Cancel Request"}
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
    </Card>
  )
}
