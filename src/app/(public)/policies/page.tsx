import PublicPage from "@/components/layout/public-page";
import Link from "next/link";
import Icon from "@/components/ui/icon";

export const metadata = {title: "Policies | Falak Rides", description: "Privacy, terms, refunds and cancellation information."};

export default function Page() {
  return <PublicPage title="Policies" description={metadata.description}>
    <div className="policies-layout">
      <div className="policy-cards">
        <article className="policy-card">
          <span className="policy-icon"><Icon name="shield" size={25}/></span>
          <h2>Privacy policy</h2>
          <p>Learn how your details are handled when preparing a request.</p>
          <Link href="/privacy">Read the privacy notice<Icon size={18}/></Link>
        </article>
        <article className="policy-card">
          <span className="policy-icon"><Icon name="check" size={25}/></span>
          <h2>Terms of service</h2>
          <p>Review how requests, quotes and confirmations work.</p>
          <Link href="/terms">Read the terms<Icon size={18}/></Link>
        </article>
      </div>
      <section className="policy-refunds" aria-labelledby="refunds-heading">
        <div className="policy-refunds-title"><span className="policy-icon"><Icon name="clock" size={25}/></span><h2 id="refunds-heading">Refunds and cancellations</h2></div>
        <div className="policy-refunds-content">
          <p>A standard refund and cancellation schedule has not been published. Ask our team for the applicable terms before accepting a quote or making a payment.</p>
          <p>If your plans change, contact support with your reference and travel date. Refund amounts, charges and processing times require confirmation.</p>
          <Link className="button" href="/contact">Contact support<Icon size={18}/></Link>
        </div>
      </section>
    </div>
  </PublicPage>;
}
