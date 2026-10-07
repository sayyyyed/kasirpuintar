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
        <Text className="mb-1.5 text-sm font-sans-medium text-kumo-strong">
          {label}
        </Text>
      )}
      <View
        className={`
          flex-row items-center rounded-lg px-3
          ${isFocused ? "bg-kumo-control border border-kumo-brand" : "bg-kumo-control border border-kumo-line"}
        `}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className="flex-1 h-10 text-sm text-kumo-default font-sans"
          placeholderTextColor="#B5B5B5"
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

export default Input;
