"use client";

import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
    return (
        <AppLayout>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/configuracion"
                        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Volver a Configuración
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 space-y-8">
                    <div className="border-b pb-4">
                        <h1 className="text-3xl font-bold text-slate-900">Políticas de Privacidad</h1>
                        <p className="text-slate-500 mt-2">Última actualización: Diciembre 2025</p>
                    </div>

                    <div className="space-y-6 text-slate-700 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Introducción</h2>
                            <p>
                                La presente Política de Privacidad describe cómo Tikko (en adelante, “la Plataforma”, “nosotros” o “nuestro”) recopila, utiliza, almacena y protege los datos personales de los usuarios conforme a la Ley N.º 25.326 de Protección de Datos Personales de la República Argentina y sus normas complementarias.
                            </p>
                            <p className="mt-2 text-slate-900 font-medium">
                                El uso de la Plataforma implica la aceptación de esta Política de Privacidad.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Datos personales que recopilamos</h2>
                            <p className="mb-3">Podemos recopilar las siguientes categorías de información:</p>

                            <h3 className="font-semibold text-slate-900 mt-4 mb-2">2.1. Datos provistos por el usuario</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Nombre y apellido</li>
                                <li>Documento de identidad (opcional según el servicio)</li>
                                <li>Información de contacto: correo electrónico, teléfono</li>
                                <li>Datos de acceso: usuario y contraseña</li>
                                <li>Información de facturación</li>
                                <li>Datos cargados en el sistema (comprobantes, archivos, registros operativos, etc.)</li>
                            </ul>

                            <h3 className="font-semibold text-slate-900 mt-4 mb-2">2.2. Datos recolectados automáticamente</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Dirección IP</li>
                                <li>Información del navegador y dispositivo</li>
                                <li>Cookies y tecnologías similares</li>
                                <li>Registros de actividad dentro de la Plataforma</li>
                            </ul>

                            <h3 className="font-semibold text-slate-900 mt-4 mb-2">2.3. Datos de terceros</h3>
                            <p>
                                En caso de que el usuario cargue información de terceros (por ejemplo, clientes, proveedores o empleados), declara contar con autorización para su tratamiento.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Finalidad del tratamiento</h2>
                            <p className="mb-3">Los datos personales serán utilizados únicamente para:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Brindar, operar y mejorar la Plataforma</li>
                                <li>Gestionar cuentas de usuario</li>
                                <li>Emitir facturación</li>
                                <li>Procesar información cargada por los usuarios</li>
                                <li>Proporcionar soporte técnico</li>
                                <li>Enviar notificaciones relevantes sobre el servicio</li>
                                <li>Cumplir obligaciones legales y regulatorias vigentes</li>
                            </ul>
                            <p className="mt-3">
                                No utilizamos los datos con finalidades distintas a las declaradas sin consentimiento previo.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Base legal del tratamiento</h2>
                            <p className="mb-3">El tratamiento de datos se realiza conforme a:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Consentimiento del usuario</li>
                                <li>Necesidad para ejecutar la relación contractual</li>
                                <li>Cumplimiento de obligaciones legales</li>
                                <li>Interés legítimo vinculado a la operación normal del servicio</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Almacenamiento y seguridad</h2>
                            <p className="mb-3">
                                Adoptamos medidas técnicas y organizativas razonables para proteger la información contra accesos no autorizados, pérdida, alteración o destrucción.
                            </p>
                            <p>
                                Los datos podrán ser almacenados en servidores propios o de terceros proveedores ubicados dentro o fuera de Argentina, siempre bajo estándares adecuados de seguridad.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Cesión y transferencia de datos</h2>
                            <p className="mb-3">Solo compartiremos datos personales en los siguientes casos:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Proveedores tecnológicos que permiten el funcionamiento de la Plataforma (hosting, bases de datos, mensajería, analítica, etc.)</li>
                                <li>Autoridades administrativas o judiciales que lo requieran legalmente</li>
                                <li>Empresas relacionadas, siempre para finalidades compatibles con esta política</li>
                                <li>Terceros autorizados explícitamente por el usuario</li>
                            </ul>
                            <p className="mt-3 font-medium">Nunca vendemos datos personales.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Derechos del titular de los datos</h2>
                            <p className="mb-3">El usuario puede ejercer en cualquier momento:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Acceso a sus datos</li>
                                <li>Rectificación de datos incorrectos</li>
                                <li>Actualización de información</li>
                                <li>Supresión (cuando corresponda)</li>
                                <li>Oposición al tratamiento</li>
                                <li>Revocación del consentimiento</li>
                            </ul>
                            <div className="mt-4 p-4 bg-slate-50 rounded-md">
                                <p className="mb-2">Para ejercer estos derechos, deberá enviar una solicitud a:</p>
                                <p className="font-semibold text-slate-900">📧 [email de contacto]</p>
                            </div>
                            <p className="mt-3 text-sm text-slate-500">
                                La Agencia de Acceso a la Información Pública (AAIP) es el órgano de control de la Ley 25.326.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Cookies y tecnologías similares</h2>
                            <p>
                                La Plataforma utiliza cookies para mejorar la experiencia del usuario, recordar preferencias y analizar el uso del servicio.
                            </p>
                            <p className="mt-2">
                                El usuario puede deshabilitarlas desde el navegador, aunque algunas funciones pueden verse afectadas.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Conservación de los datos</h2>
                            <p className="mb-3">Los datos serán conservados durante:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>La vigencia de la relación contractual</li>
                                <li>El tiempo necesario para cumplir obligaciones legales o resolver disputas</li>
                            </ul>
                            <p className="mt-2">
                                Una vez vencidos esos plazos, se eliminarán o anonimizarán de forma segura.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Modificaciones a esta Política</h2>
                            <p>
                                Podemos actualizar esta Política de Privacidad. Notificaremos al usuario cuando haya cambios sustanciales.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
