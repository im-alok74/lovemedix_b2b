'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle, IndianRupee, FileText } from "lucide-react"

interface PurchaseRequest {
  id: number
  pharmacy_name: string
  status: string
  total_amount: string
  item_count: number
  items_total?: string
  created_at: string
  approved_by?: string | null
  payment_collected_at?: string | null
  invoice_number?: string | null
  invoice_payment_status?: string | null
  items?: Array<{
    id: number
    medicine_id: number
    medicine_name: string
    batch_number: string | null
    expiry_date: string | null
    quantity: number
    price: string
    line_total: string
  }>
}

export function DistributorPurchaseRequestsTable() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<PurchaseRequest | null>(null)
  const { toast } = useToast()

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)

      const res = await fetch(`/api/distributor/purchase-requests?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json()
      if (res.ok) {
        setRequests(data.requests || [])
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load purchase requests",
          variant: "destructive",
        })
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const act = async (id: number, action: "approve" | "reject" | "mark-paid") => {
    try {
      const res = await fetch(`/api/distributor/purchase-requests/${id}/${action}`, {
        method: "PATCH",
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Success", description: `Request updated: ${data.status || action}` })
        fetchRequests()
      } else {
        toast({
          title: "Error",
          description: data.error || "Action failed",
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    }
  }

  const badgeVariant = (status: string) => {
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

  if (isLoading) return <div className="text-center text-muted-foreground">Loading...</div>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Procurement Requests</CardTitle>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved (Unpaid)</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
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
                  No requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">PR-{r.id}</TableCell>
                  <TableCell>{r.pharmacy_name}</TableCell>
                  <TableCell>{r.item_count}</TableCell>
                  <TableCell>₹{Number(r.total_amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(r.status)}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelected(r)}>
                        Details
                      </Button>
                      {r.invoice_number && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={`/api/purchase-requests/${r.id}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Invoice
                          </a>
                        </Button>
                      )}
                      {r.invoice_number && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={`/api/purchase-requests/${r.id}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.preventDefault()
                              const w = window.open(`/api/purchase-requests/${r.id}/invoice`, "_blank")
                              if (w) {
                                w.addEventListener("load", () => w.print(), { once: true })
                              }
                            }}
                          >
                            Print
                          </a>
                        </Button>
                      )}
                      {r.status === "PENDING" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => act(r.id, "approve")}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => act(r.id, "reject")}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {r.status === "APPROVED" && (
                        <Button size="sm" onClick={() => act(r.id, "mark-paid")}>
                          <IndianRupee className="h-4 w-4 mr-1" />
                          Mark COD Paid
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

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Request PR-{selected?.id} Details
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pharmacy</p>
                  <p className="font-medium">{selected.pharmacy_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Invoice</p>
                  <p className="font-medium">{selected.invoice_number || "Not generated yet"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={badgeVariant(selected.status)}>{selected.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">₹{Number(selected.total_amount || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-sm font-semibold mb-2">Purchased Items</p>
                {!selected.items || selected.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No item details available.</p>
                ) : (
                  <div className="space-y-2">
                    {selected.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded border p-2 text-xs">
                        <div>
                          <p className="font-medium">{item.medicine_name}</p>
                          <p className="text-muted-foreground">
                            Batch: {item.batch_number || "N/A"} | Exp: {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p>Qty: {item.quantity}</p>
                          <p>Unit: ₹{Number(item.price || 0).toFixed(2)}</p>
                          <p className="font-semibold">₹{Number(item.line_total || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selected.invoice_number && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" asChild>
                    <a
                      href={`/api/purchase-requests/${selected.id}/invoice`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Invoice
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href={`/api/purchase-requests/${selected.id}/invoice`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault()
                        const w = window.open(`/api/purchase-requests/${selected.id}/invoice`, "_blank")
                        if (w) {
                          w.addEventListener("load", () => w.print(), { once: true })
                        }
                      }}
                    >
                      Print Invoice
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

