import React, { useState, useCallback } from "react";
import { TextInput, View, Text, type TextInputProps } from "react-native";
import { formatCurrency } from "@/utils/currency";

export function formatRupiah(value: string): string {
  return value ? formatCurrency(value).replace(/^Rp\s*/, "") : "";
}

interface CurrencyInputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  value: string;
  onValueChange: (raw: string) => void;
  label?: string;
  error?: string;
}

export function CurrencyInput({
  value,
  onValueChange,
  label,
  error,
  ...props
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback(
    (text: string) => {
      const digits = text.replace(/[^0-9]/g, "");
      onValueChange(digits);
    },
    [onValueChange]
  );

  const displayValue = value ? formatRupiah(value) : "";

  return (
    <View className="w-full">
      {label && (
        <Text className="mb-1.5 text-sm font-sans-medium text-kumo-strong">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center rounded-md px-4 ${
          isFocused ? "bg-kumo-control border border-kumo-brand" : "bg-kumo-control border border-kumo-line"
        }`}
      >
        <TextInput
          className="flex-1 h-10 text-sm text-kumo-default font-sans"
          placeholderTextColor="#B5B5B5"
          keyboardType="number-pad"
          value={displayValue}
          onChangeText={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {error && (
        <Text className="mt-1 text-sm text-kumo-danger font-sans">{error}</Text>
      )}
    </View>
  );
}
