import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import Wrapper from "./wrapper";

// Configure the font
const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <UserProvider>
          <Wrapper>
            {children}
          </Wrapper>
        </UserProvider>
      </body>
    </html>
  );
}