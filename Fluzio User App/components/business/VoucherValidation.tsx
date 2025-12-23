import React, { useState } from 'react';
import { Card, Button } from '../Common';
import { Scan, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface VoucherValidationProps {
  businessId: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  redemption?: {
    id: string;
    title: string;
    description: string;
    customerName: string;
    redeemedAt: string;
    expiresAt: string;
    type: string;
    costPoints: number;
  };
  usedAt?: string;
}

export const VoucherValidation: React.FC<VoucherValidationProps> = ({ businessId }) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [marking, setMarking] = useState(false);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!voucherCode.trim()) {
      alert('Please enter a voucher code');
      return;
    }

    setValidating(true);
    setResult(null);

    try {
      const response = await fetch(
        'https://us-central1-fluzio-13af2.cloudfunctions.net/validateVoucher',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voucherCode: voucherCode.toUpperCase().trim(),
            businessId
          })
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Validation error:', error);
      setResult({
        valid: false,
        error: 'Network error. Please try again.'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleMarkAsUsed = async () => {
    if (!result?.redemption?.id) return;

    if (!confirm('Mark this voucher as used?')) return;

    setMarking(true);

    try {
      const response = await fetch(
        'https://us-central1-fluzio-13af2.cloudfunctions.net/markVoucherUsed',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            redemptionId: result.redemption.id,
            businessId
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('✅ Voucher marked as used!');
        setVoucherCode('');
        setResult(null);
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Error marking voucher:', error);
      alert('Error marking voucher as used');
    } finally {
      setMarking(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] rounded-xl flex items-center justify-center">
            <Scan className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1E0E62]">Validate Voucher</h2>
            <p className="text-sm text-gray-500">Scan or enter customer's voucher code</p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleValidate} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Enter voucher code (e.g., FLUZ-ABC123XYZ)"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-lg font-mono uppercase focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
              disabled={validating}
            />
            <Button
              type="submit"
              disabled={validating || !voucherCode.trim()}
              className="px-8"
            >
              {validating ? 'Checking...' : 'Validate'}
            </Button>
          </div>
        </form>

        {/* Validation Result */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom duration-300">
            {result.valid && result.redemption ? (
              // Valid Voucher
              <Card className="p-6 border-2 border-green-500 bg-green-50">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-900 mb-2">Valid Voucher ✓</h3>
                    
                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="text-sm font-semibold text-green-800">Reward</div>
                        <div className="text-lg font-bold text-green-900">{result.redemption.title}</div>
                        <div className="text-sm text-green-700">{result.redemption.description}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-semibold text-green-800">Customer</div>
                          <div className="text-green-900">{result.redemption.customerName}</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-green-800">Points Used</div>
                          <div className="text-green-900">{result.redemption.costPoints} points</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-semibold text-green-800">Redeemed</div>
                          <div className="text-sm text-green-700">{formatDate(result.redemption.redeemedAt)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-green-800">Expires</div>
                          <div className="text-sm text-green-700">{formatDate(result.redemption.expiresAt)}</div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleMarkAsUsed}
                      disabled={marking}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {marking ? 'Marking as Used...' : 'Mark as Used'}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              // Invalid Voucher
              <Card className="p-6 border-2 border-red-500 bg-red-50">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shrink-0">
                    <XCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-900 mb-2">Invalid Voucher</h3>
                    <p className="text-red-700">
                      {result.error || 'This voucher code is not valid or has already been used.'}
                    </p>
                    {result.usedAt && (
                      <p className="text-sm text-red-600 mt-2">
                        Used on: {formatDate(result.usedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Instructions */}
        {!result && !validating && (
          <Card className="p-4 bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">How to validate:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Ask customer for their voucher code</li>
                  <li>Enter or scan the code above</li>
                  <li>If valid, provide the reward to the customer</li>
                  <li>Click "Mark as Used" to complete the redemption</li>
                </ol>
              </div>
            </div>
          </Card>
        )}
      </Card>

      {/* Recent Validations */}
      <Card className="mt-6 p-6">
        <h3 className="text-lg font-bold text-[#1E0E62] mb-4">Quick Tips</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>Voucher codes are case-insensitive (FLUZ-ABC123 = fluz-abc123)</span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
            <span>Check expiration dates before accepting vouchers</span>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span>Each voucher can only be used once</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <span>Contact support if you encounter issues with valid vouchers</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
