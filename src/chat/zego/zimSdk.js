let sdkPromise = null;

export async function getZimSdk() {
  if (!sdkPromise) {
    sdkPromise = import("zego-zim-web");
  }
  return sdkPromise;
}

