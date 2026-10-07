import React, {
  Children,
  useImperativeHandle,
  useState,
} from "react";
import { View } from "react-native";

type PagerViewProps = {
  children?: React.ReactNode;
  style?: object;
  initialPage?: number;
  onPageScroll?: (event: { nativeEvent: { offset: number; position: number } }) => void;
  onPageSelected?: (event: { nativeEvent: { position: number } }) => void;
};

export default React.forwardRef<any, PagerViewProps>(function WebPagerView(
  {
    children,
    style,
    initialPage = 0,
    onPageScroll,
    onPageSelected,
  },
  ref
) {
  const [page, setPage] = useState(initialPage);
  const pages = Children.toArray(children);

  useImperativeHandle(ref, () => ({
    setPage(nextPage: number) {
      setPage(nextPage);
      onPageScroll?.({
        nativeEvent: { offset: 0, position: nextPage },
      });
      onPageSelected?.({
        nativeEvent: { position: nextPage },
      });
    },
  }), [onPageScroll, onPageSelected]);

  return <View style={style}>{pages[page] ?? null}</View>;
});
