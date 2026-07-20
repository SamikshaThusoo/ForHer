import { Redirect } from "expo-router";

// The standalone For Her dashboard is retired — anything pointing here goes home.
export default function ForherRedirect() {
  return <Redirect href="/" />;
}
