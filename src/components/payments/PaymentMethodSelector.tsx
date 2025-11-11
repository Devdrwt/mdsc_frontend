'use client';

import React from 'react';
import { CreditCard, Smartphone, Check } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selectedMethod: 'card' | 'mobile_money' | 'gobipay' | null;
  onSelectMethod: (method: 'card' | 'mobile_money' | 'gobipay') => void;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthode de paiement</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Carte bancaire */}
        <button
          onClick={() => onSelectMethod('card')}
          className={`relative p-6 border-2 rounded-lg transition-all ${
            selectedMethod === 'card'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${
                selectedMethod === 'card' ? 'bg-blue-600' : 'bg-gray-100'
              }`}>
                <CreditCard className={`h-6 w-6 ${
                  selectedMethod === 'card' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900">Carte bancaire</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Visa, Mastercard, etc.
                </p>
              </div>
            </div>
            {selectedMethod === 'card' && (
              <Check className="h-5 w-5 text-blue-600" />
            )}
          </div>
        </button>

        {/* Mobile Money */}
        <button
          onClick={() => onSelectMethod('mobile_money')}
          className={`relative p-6 border-2 rounded-lg transition-all ${
            selectedMethod === 'mobile_money'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${
                selectedMethod === 'mobile_money' ? 'bg-blue-600' : 'bg-gray-100'
              }`}>
                <Smartphone className={`h-6 w-6 ${
                  selectedMethod === 'mobile_money' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900">Mobile Money</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Orange Money, MTN, Moov
                </p>
              </div>
            </div>
            {selectedMethod === 'mobile_money' && (
              <Check className="h-5 w-5 text-blue-600" />
            )}
          </div>
        </button>

        {/* GobiPay */}
        <button
          onClick={() => onSelectMethod('gobipay')}
          className={`relative p-6 border-2 rounded-lg transition-all ${
            selectedMethod === 'gobipay'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div
                className={`p-3 rounded-lg ${
                  selectedMethod === 'gobipay' ? 'bg-blue-600' : 'bg-gray-100'
                }`}
              >
                <CreditCard
                  className={`h-6 w-6 ${
                    selectedMethod === 'gobipay' ? 'text-white' : 'text-gray-600'
                  }`}
                />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900">GobiPay</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Paiement par wallet GobiPay (carte & mobile money)
                </p>
              </div>
            </div>
            {selectedMethod === 'gobipay' && (
              <Check className="h-5 w-5 text-blue-600" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

