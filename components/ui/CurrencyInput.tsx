import React, { useState, useCallback } from "react";
import { TextInput, View, Text, type TextInputProps } from "react-native";

export function formatRupiah(value: string): string {
  const num = parseInt(value, 10);
  if (isNaN(num)) return "";
  return num.toLocaleString("id-ID");
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

  const displayValue = isFocused ? value : (value ? formatRupiah(value) : "");

  return (
    <View className="w-full">
      {label && (
        <Text className="mb-2 text-sm font-sans-medium text-gray-600 uppercase tracking-wider">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center rounded-md px-4 ${
          isFocused ? "bg-white border-2 border-primary" : "bg-muted border-2 border-transparent"
        }`}
      >
        {!isFocused && value ? (
          <Text className="mr-1 text-base text-gray-400 font-sans">Rp</Text>
        ) : null}
        <TextInput
          className="flex-1 h-14 text-base text-foreground font-sans"
          placeholderTextColor="#9CA3AF"
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
        <Text className="mt-1 text-sm text-red-500 font-sans">{error}</Text>
      )}
    </View>
  );
}
