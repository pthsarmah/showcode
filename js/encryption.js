function pemToArrayBuffer(pem) {
	const b64 = pem
		.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, "")
		.replace(/\s+/g, "");

	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}

	return bytes.buffer;
}

function toBase64(buf) {
	return btoa(String.fromCharCode(...new Uint8Array(buf)));
}


async function importPublicKey(pemKey) {

	const spki = pemToArrayBuffer(pemKey);
	return crypto.subtle.importKey(
		"spki",
		spki,
		{
			name: "RSA-OAEP",
			hash: "SHA-256",
		},
		true,
		["encrypt"]
	);
}

export async function encryptWithPublicKey(plainText, pemPublicKey) {
	try {

		const rsaKey = await importPublicKey(pemPublicKey);

		const aesKey = await crypto.subtle.generateKey(
			{ name: "AES-GCM", length: 256 },
			true,
			["encrypt"]
		);

		const iv = crypto.getRandomValues(new Uint8Array(12));
		const data = new TextEncoder().encode(plainText);

		const ciphertext = await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv },
			aesKey,
			data
		);

		const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);

		const encryptedKey = await crypto.subtle.encrypt(
			{ name: "RSA-OAEP" },
			rsaKey,
			rawAesKey
		);

		return {
			encryptedKey: toBase64(encryptedKey),
			iv: toBase64(iv),
			ciphertext: toBase64(ciphertext),
		};

	} catch (e) {
		console.error("Encryption Failed:", e);
		throw new Error("Could not encrypt data. Public key invalid or crypto failure.");
	}
}

