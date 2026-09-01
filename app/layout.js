import "./globals.css";
import Loader from "@/components/Loader";
import CustomCursor from "@/components/CustomCursor";
import { CartProvider } from "@/lib/CartContext";

export const metadata = {
  title: "MASH",
  description: "Multi-cuisine, mashed together.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Loader />
          <CustomCursor />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
