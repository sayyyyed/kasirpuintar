import React from "react";
import PagerView from "react-native-pager-view";

export default React.forwardRef<any, React.ComponentProps<typeof PagerView>>(
  function NativePagerView(props, ref) {
    return <PagerView ref={ref} {...props} />;
  }
);
