"use strict";
/**
 * PaymentForm Component - Stripe Payment Elements Form
 */
'use client';
/**
 * PaymentForm Component - Stripe Payment Elements Form
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PaymentForm;
const react_1 = require("react");
const react_stripe_js_1 = require("@stripe/react-stripe-js");
function PaymentForm({ sessionId, onSuccess }) {
    const stripe = (0, react_stripe_js_1.useStripe)();
    const elements = (0, react_stripe_js_1.useElements)();
    const [error, setError] = (0, react_1.useState)(null);
    const [processing, setProcessing] = (0, react_1.useState)(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) {
            return;
        }
        setProcessing(true);
        setError(null);
        try {
            const { error: submitError } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/build/${sessionId}`,
                },
                redirect: 'if_required',
            });
            if (submitError) {
                setError(submitError.message || 'Payment failed');
                setProcessing(false);
            }
            else {
                // Payment successful
                onSuccess();
            }
        }
        catch (err) {
            setError(err.message || 'An unexpected error occurred');
            setProcessing(false);
        }
    };
    return (<form onSubmit={handleSubmit}>
      <react_stripe_js_1.PaymentElement />

      {error && (<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>)}

      <button type="submit" disabled={!stripe || processing} className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors">
        {processing ? (<span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>) : ('Pay $49.00')}
      </button>

      <div className="mt-4 text-center text-xs text-gray-500">
        Your payment information is securely processed by Stripe.
        <br />
        We never see or store your card details.
      </div>
    </form>);
}
//# sourceMappingURL=PaymentForm.js.map