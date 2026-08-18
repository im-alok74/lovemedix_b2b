import { PageShell, Prose } from "@/components/page-shell"
import { buildMetadata } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const metadata = buildMetadata({
  title: "Refund & return policy",
  description: `When you can return medicines ordered on ${SITE.name}, how refunds are processed, and which items cannot be returned for safety reasons.`,
  path: "/refund",
})

export default function RefundPage() {
  return (
    <PageShell
      title="Refund & return policy"
      description="What can be returned, what cannot, and how long a refund takes."
      crumbs={[{ name: "Refund policy", path: "/refund" }]}
    >
      <Prose>
        <h2>Cancelling before dispatch</h2>
        <p>
          You can cancel any order at no cost until the pharmacy marks it as packed. Open the order
          from <strong>My Orders</strong> and choose Cancel. If you paid online, the refund is
          initiated the same day.
        </p>

        <h2>What you can return</h2>
        <p>
          Report any of the following within {SITE.promise.returnWindow} of delivery and we will
          arrange a free pickup and a full refund:
        </p>
        <ul>
          <li>you received the wrong medicine, strength or pack size;</li>
          <li>the item arrived damaged, leaking or with broken packaging;</li>
          <li>the pack is expired or expires sooner than the stated shelf life;</li>
          <li>the seal was already broken;</li>
          <li>an item on the invoice is missing from the package.</li>
        </ul>

        <h2>What cannot be returned</h2>
        <p>
          These restrictions exist because a medicine that has left our custody cannot be verified
          as safely stored, and reselling it would put the next patient at risk.
        </p>
        <ul>
          <li>medicines whose seal or strip has been opened, unless the item was faulty;</li>
          <li>
            cold-chain products such as insulin, vaccines and certain injectables, which must stay
            within a controlled temperature range;
          </li>
          <li>
            products bought correctly but no longer wanted — a change of mind is not a valid ground
            for returning medicine;
          </li>
          <li>items reported more than {SITE.promise.returnWindow} after delivery.</li>
        </ul>

        <h2>How to raise a return</h2>
        <ol>
          <li>Open the order in <strong>My Orders</strong> and select <strong>Report an issue</strong>.</li>
          <li>Choose the affected items and describe the problem.</li>
          <li>Attach a photo of the item and its packaging. This usually settles the case immediately.</li>
          <li>We respond within one working day and arrange a pickup where a return is due.</li>
        </ol>

        <h2>How long a refund takes</h2>
        <table>
          <thead>
            <tr>
              <th>Payment method</th>
              <th>Refund destination</th>
              <th>Time after approval</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>UPI</td>
              <td>Source UPI account</td>
              <td>1–3 working days</td>
            </tr>
            <tr>
              <td>Debit / credit card</td>
              <td>Original card</td>
              <td>5–7 working days</td>
            </tr>
            <tr>
              <td>Net banking</td>
              <td>Source bank account</td>
              <td>5–7 working days</td>
            </tr>
            <tr>
              <td>Cash on delivery</td>
              <td>Bank account you nominate</td>
              <td>3–5 working days</td>
            </tr>
          </tbody>
        </table>
        <p>
          The time your bank takes to post the credit is outside our control. We share the refund
          reference as soon as it is issued so you can trace it.
        </p>

        <h2>Partial refunds</h2>
        <p>
          If only part of an order is affected, we refund those items plus a proportionate share of
          the delivery charge. The rest of the order stands.
        </p>

        <h2>Contact</h2>
        <p>
          Email <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a> with your order
          number, or call <a href={`tel:${SITE.contact.phone.replace(/\s/g, "")}`}>{SITE.contact.phone}</a>.
        </p>
      </Prose>
    </PageShell>
  )
}
