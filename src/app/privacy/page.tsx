export const metadata = { title: "Privacy Policy · ShopNow" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">How ShopNow collects, uses and protects your information.</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="font-black text-gray-900 mb-2">Information we collect</h2>
            <p>When you create an account or place an order, we collect your name, email, phone number, delivery address and order history. We may also record basic usage data to improve the store.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">How we use it</h2>
            <p>We use your information to process and deliver orders, provide customer support, prevent fraud, and — only where you have opted in — to send offers and updates. You can unsubscribe from marketing at any time.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">Payments</h2>
            <p>We never store your full card details. Online payments are handled by a PCI-compliant payment provider. Cash on Delivery is available where supported.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">Cookies</h2>
            <p>We use cookies and local storage to keep you signed in, remember your cart, and understand how the store is used. You can control cookies through your browser settings.</p>
          </section>
          <section>
            <h2 className="font-black text-gray-900 mb-2">Your choices</h2>
            <p>You may access, update or request deletion of your account information, subject to records we must retain for legal and operational reasons. Contact us at <a href="mailto:elafqazi1407@gmail.com" className="text-brand font-semibold">elafqazi1407@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
