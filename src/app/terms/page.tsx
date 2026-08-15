export const metadata = { title: "Terms of Service · ShopNow" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">The terms that govern your use of ShopNow.</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="font-black text-gray-900 mb-2">Acceptance</h2>
            <p>By using ShopNow you agree to these terms. If you do not agree, please do not use the store.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">Your account</h2>
            <p>You are responsible for keeping your account credentials secure and for activity under your account. Provide accurate information when registering and at checkout.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">Pricing &amp; availability</h2>
            <p>Prices are shown in Pakistani Rupees (PKR) and may change without notice. Products are subject to availability, and we may cancel or limit orders in case of pricing errors or stock issues.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">Orders</h2>
            <p>Placing an order is an offer to buy; an order is confirmed once we accept and process it. The final payable amount, including any delivery charge and discount, is shown before you confirm.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">Returns &amp; refunds</h2>
            <p>Eligible items may be returned or exchanged per our <a href="/shipping-returns" className="text-brand font-semibold">Shipping &amp; Returns</a> policy. Refunds are issued to the original payment method or as store credit where applicable.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">Governing law</h2>
            <p>These terms are governed by the laws of Pakistan. Questions? Email <a href="mailto:support@shopnow.pk" className="text-brand font-semibold">support@shopnow.pk</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
