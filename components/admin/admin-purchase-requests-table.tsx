'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle, IndianRupee } from "lucide-react"

interface PurchaseRequest {
  id: number
  pharmacy_name: string
  status: string
  total_amount: string
  items_total: string | null
  item_count: number
  created_at: string
}

export function AdminPurchaseRequestsTable() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRequests, setTotalRequests] = useState(0)
  const { toast } = useToast()

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("page", currentPage.toString())
      params.set("limit", "10")

      const response = await fetch(`/api/admin/purchase-requests?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      })

      const data = await response.json()

      if (response.ok) {
        setRequests(data.requests || [])
        // Backend doesn't yet return total count; approximate via page length for now
        setTotalRequests(data.requests?.length || 0)
        setTotalPages(1)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch purchase requests",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching purchase requests:", error)
      toast({
        title: "Error",
        description: "Something went wrong while fetching purchase requests",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [statusFilter, currentPage])

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/purchase-requests/${id}/approve`, {
        method: "PATCH",
      })
      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Request approved",
          description: "Stock moved to pharmacy inventory and invoice generated.",
        })
        fetchRequests()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to approve request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Approve error:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/purchase-requests/${id}/reject`, {
        method: "PATCH",
      })
      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Request rejected",
          description: "Reserved stock has been released.",
        })
        fetchRequests()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reject request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Reject error:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleMarkPaid = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/purchase-requests/${id}/mark-paid`, {
        method: "PATCH",
      })
      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Payment recorded",
          description: "Invoice marked as paid.",
        })
        fetchRequests()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to mark as paid",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Mark-paid error:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default"
      case "APPROVED":
        return "outline"
      case "PENDING":
        return "secondary"
      case "REJECTED":
      case "EXPIRED":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading purchase requests...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pharmacy Procurement Requests ({totalRequests})</CardTitle>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Pharmacy</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No purchase requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">PR-{req.id}</TableCell>
                  <TableCell>{req.pharmacy_name}</TableCell>
                  <TableCell>{req.item_count}</TableCell>
                  <TableCell>
                    ₹{Number.parseFloat(req.total_amount || req.items_total || "0").toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(req.status)}>{req.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {req.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(req.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(req.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {req.status === "APPROVED" && (
                        <Button size="sm" onClick={() => handleMarkPaid(req.id)}>
                          <IndianRupee className="h-4 w-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

