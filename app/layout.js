import "./globals.css";
import Loader from "@/components/Loader";
import CustomCursor from "@/components/CustomCursor";
import PinnedOrderTracker from "@/components/PinnedOrderTracker";
import { CartProvider } from "@/lib/CartContext";

export const metadata = {
  title: "MASH",
  description: "Multi-cuisine, mashed together.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <CartProvider>
          <Loader />
          <CustomCursor />
          {children}
          <PinnedOrderTracker />
        </CartProvider>
      </body>
    </html>
  );
}
