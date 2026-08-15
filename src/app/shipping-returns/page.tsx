export const metadata = { title: "Shipping & Returns · ShopNow" };

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Shipping &amp; Returns</h1>
        <p className="text-sm text-gray-400 mb-8">Delivery timelines, charges and our return/exchange policy.</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="font-black text-gray-900 mb-2">Delivery</h2>
            <p>We deliver nationwide across Pakistan. Orders are typically delivered within <span className="font-semibold text-gray-800">3–5 business days</span> of confirmation. You can track your order status any time from <a href="/orders" className="text-brand font-semibold">My Orders</a>.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">Charges</h2>
            <p>Delivery is <span className="font-semibold text-gray-800">free on orders of Rs 2,000 and above</span>. A flat Rs 200 delivery fee applies below that. Cash on Delivery (COD) and online payment are both supported.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">Returns &amp; exchanges</h2>
            <p>If something isn&apos;t right, you can request a return or exchange within <span className="font-semibold text-gray-800">7 days</span> of delivery. Items should be unused, in their original condition and packaging.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">How to request</h2>
            <p>Open the order in <a href="/orders" className="text-brand font-semibold">My Orders</a>, choose Return/Exchange, pick a reason (damaged, wrong item, wrong size, quality issue or other) and attach photos where relevant. You can follow the status in <a href="/returns" className="text-brand font-semibold">My Returns</a>.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">Refunds</h2>
            <p>Once your return is received and inspected, an eligible refund is processed to your original payment method or as store credit. Need help? Email <a href="mailto:support@shopnow.pk" className="text-brand font-semibold">support@shopnow.pk</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
