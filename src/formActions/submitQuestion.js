export async function subMitQuestion({ request }) {
  const formData = await request.formData();
  const title = formData.get("title");
  const description = formData.get("description");

  if (title && description) {
    const data = {
      title,
      description,
      icon: "https://raw.githubusercontent.com/ed-marquez/hedera-dapp-days/testing/src/assets/hederaLogo.png",
      date: new Date().toISOString(),
    };

    return { success: true, data };
  }
}
