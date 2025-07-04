import { NextRequest, NextResponse } from 'next/server';
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js';

// Define la estructura esperada del cuerpo de la solicitud que llega desde el frontend.
interface IRequestPayload {
	payload: ISuccessResult;
	action: string;
	signal: string | undefined;
}

/**
 * Maneja las solicitudes POST a /api/verify.
 * @param req La solicitud entrante de Next.js.
 */
export async function POST(req: NextRequest) {
	try {
		const { payload, action, signal } = (await req.json()) as IRequestPayload;

		// Asegúrate de que tu App ID esté configurado en las variables de entorno.
		// Este es el ID de tu app que obtienes del Developer Portal de Worldcoin.
		const app_id = process.env.NEXT_PUBLIC_APP_ID as `app_${string}`;
		if (!app_id) {
			console.error('APP_ID no está configurado en las variables de entorno.');
			return NextResponse.json({ success: false, message: 'Error de configuración del servidor.' }, { status: 500 });
		}

		// Llama al servicio en la nube de World ID para verificar la prueba.
		// Esta es la llamada de verificación crucial que confirma que la prueba es válida.
		const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse;

		if (verifyRes.success) {
			// La verificación fue exitosa. El usuario ha demostrado su humanidad para esta acción.
			console.log(`Prueba para la acción "${action}" verificada exitosamente.`);
			return NextResponse.json({ success: true, ...verifyRes }, { status: 200 });
		} else {
			// La verificación falló. Esto puede ocurrir si el usuario ya se verificó para esta acción (el nullifier ya fue usado)
			// o si hay algún otro problema con la prueba.
			console.error(`La verificación para la acción "${action}" falló:`, verifyRes);
			return NextResponse.json({ success: false, verifyRes }, { status: 400 });
		}
	} catch (error) {
		console.error('Error en /api/verify:', error);
		return NextResponse.json({ success: false, message: 'Error Interno del Servidor' }, { status: 500 });
	}
}
