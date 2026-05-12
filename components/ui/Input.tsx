import React, { useState } from "react";
import { TextInput, View, Text, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="w-full">
      {label && (
        <Text className="mb-2 text-sm font-sans-medium text-gray-600 uppercase tracking-wider">
          {label}
        </Text>
      )}
      <View
        className={`
          flex-row items-center rounded-md px-4
          ${isFocused ? "bg-white border-2 border-primary" : "bg-muted border-2 border-transparent"}
        `}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className="flex-1 h-14 text-base text-foreground font-sans"
          placeholderTextColor="#9CA3AF"
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

export default Input;
