// Language switch. The page is written in Spanish, the default and what loads without JavaScript;
// English replaces each text from the table below, looked up by its Spanish text with the spaces
// collapsed. That covers text nodes and the attributes people meet (aria-label, alt, title, placeholder),
// so the pricing and the request form that the build writes need no markup of their own. Text that
// scripts write later (the form's messages, the tour's Pause label) is caught by a MutationObserver, so
// this file loads after the other scripts. Parts marked data-i18n="off" stay Spanish: the Bogotá
// clinic's screens in the feature tour and the privacy policy's legal text. The choice is kept in
// localStorage; ?lang=en or ?lang=es in the address sets it too.
(function () {
  var KEY = 'gtl-lang';
  var html = document.documentElement;

  var EN = {
    // Head
    'GTL AI | Impulsando sueños': 'GTL AI | Empowering dreams',
    'Creamos la página web de su negocio con agenda, pedidos o reservas en línea. Planes con precios claros y soporte en Colombia.': 'We build your business website with online scheduling, orders or bookings. Plans with clear prices and support in Colombia.',
    'Política de tratamiento de datos personales — GTL AI': 'Personal data policy — GTL AI',

    // Header, hero
    'Funciones': 'Features',
    'Planes': 'Plans',
    'Equipo': 'Team',
    'Contáctenos': 'Get in Touch',
    'Software para impulsar su': 'Software for empowering your',
    'sueño': 'dream',
    'Agenda, reservas en línea, ventas y pagos en un solo lugar. Una plataforma completa, rápida, confiable, fácil de usar y que funciona en cualquier dispositivo.': 'Calendar, online booking, sales and payments in one place. A complete platform that is fast, reliable, easy to use, and works on any device.',
    'Ver planes y precios': 'See plans & pricing',
    'Conozca a los fundadores': 'Meet the founders',

    // Feature tour
    'Página web y SEO': 'Landing page & SEO',
    'Agenda': 'Calendar',
    'Reservas en línea': 'Online booking',
    'Ventas y pagos': 'Sales & payments',
    'Finanzas y contabilidad': 'Finance & accounting',
    'Llamadas y mensajes': 'Calls & texts',
    'Pausar recorrido': 'Pause tour',
    'Reanudar recorrido': 'Play tour',
    'Una página web que le trae pacientes': 'A website that brings patients in',
    'Una página rápida que se ve bien en cualquier celular, preparada para que la gente cercana lo encuentre en Google y reserve con un toque.': 'A fast landing page that looks right on every phone, set up so people nearby find you on Google and book in one tap.',
    'Todo el día de su equipo de un vistazo': 'Your whole team’s day at a glance',
    'Las citas de cada profesional por día o por semana, con colores por servicio y los datos de cada paciente a un clic.': 'Every professional’s appointments by day or week, color-coded by service, with each patient’s details one click away.',
    'Sus pacientes reservan solos, de día y de noche': 'Patients book themselves, day and night',
    'Su página web recibe reservas a toda hora: el paciente elige el servicio, el profesional y un horario libre, y la cita aparece de inmediato en su agenda.': 'Your website takes bookings around the clock: patients choose the service, the professional and a free time, and it appears in your calendar right away.',
    'Cobre en segundos, como sea que le paguen': 'Charge in seconds, however they pay',
    'Reciba tarjeta, transferencia o efectivo en recepción, o envíe un link de pago. Cada venta queda en una sola lista con su estado.': 'Take card, bank transfer or cash at the front desk, or send a payment link. Every sale lands in one list with its status.',
    'Sepa a dónde va cada peso': 'Know where every peso goes',
    'Ingresos, gastos y utilidad mes a mes, con una exportación lista para su contador. La facturación electrónica DIAN llegará pronto.': 'Income, expenses and profit month by month, with a clean export for your accountant. DIAN electronic invoicing is coming soon.',
    'Todas las conversaciones en una sola bandeja': 'Every conversation in one inbox',
    'Mensajes de WhatsApp, SMS y llamadas perdidas junto al historial de cada paciente. Los recordatorios automáticos por WhatsApp llegarán pronto.': 'WhatsApp messages, texts and missed calls side by side with each patient’s history. Automatic WhatsApp reminders are coming soon.',

    // Pricing: head, packages, tiers
    'Planes y precios': 'Plans & pricing',
    'Una puesta en marcha única para poner su negocio en línea y una mensualidad que lo mantiene funcionando, seguro y al día.': 'A one-time setup to get your business online, and a monthly fee that keeps it running, secure and up to date.',
    'Paquetes': 'Packages',
    'Presencia': 'Presence',
    'Pedidos': 'Orders',
    'Reservas': 'Bookings',
    'Comunidad': 'Community',
    'A medida': 'Custom',
    'Esencial': 'Essential',
    'Crece': 'Grow',
    'Mensualidad': 'Monthly fee',
    '/ mes + IVA': '/ month + VAT',
    'Puesta en marcha (pago único)': 'Setup (one-time payment)',
    '+ IVA': '+ VAT',
    'Solicitar este plan': 'Request this plan',
    'Solicitar este paquete': 'Request this bundle',
    '(abre un formulario)': '(opens a form)',
    'Más elegido': 'Most popular',
    'Todo lo de Esencial, y además:': 'Everything in Essential, plus:',
    'Todo lo de Crece, y además:': 'Everything in Grow, plus:',
    'por unidad al mes + IVA': 'per unit per month + VAT',
    'Mínimo': 'Minimum',
    'A cotizar': 'Quote on request',
    'Desde': 'From',
    'por proyecto + IVA': 'per project + VAT',
    'por asamblea + IVA': 'per assembly + VAT',
    'Precio de lista:': 'List price:',
    'Próximamente': 'Coming soon',

    'Página web con agenda en línea para consultorios y centros de salud y bienestar.': 'A website with online scheduling for practices and health and wellness centers.',
    'Para un profesional independiente.': 'For an independent professional.',
    'Agenda en línea': 'Online scheduling',
    '1 sede': '1 location',
    '1 profesional': '1 professional',
    '1 cambio pequeño al mes': '1 small change a month',
    'Para consultorios con equipo.': 'For practices with a team.',
    'Hasta 5 profesionales': 'Up to 5 professionals',
    'Recordatorios por WhatsApp — Próximamente': 'WhatsApp reminders — Coming soon',
    'Anticipos en línea — Próximamente': 'Online deposits — Coming soon',
    'Gestión de su Perfil de Empresa en Google': 'Management of your Google Business Profile',
    '2 cambios al mes': '2 changes a month',
    'Informe mensual de resultados': 'Monthly results report',
    'Para varias sedes y más pacientes.': 'For several locations and more patients.',
    'Varias sedes': 'Several locations',
    'Facturación electrónica DIAN incluida (próximamente)': 'DIAN electronic invoicing included (coming soon)',
    'Panel de métricas': 'Metrics dashboard',
    'Soporte prioritario': 'Priority support',
    '4 cambios al mes': '4 changes a month',

    'Una página web profesional para cualquier negocio.': 'A professional website for any business.',
    'Para empezar con lo esencial.': 'To start with the essentials.',
    'Sitio de una página con la plantilla de su sector': 'One-page site with your industry’s template',
    'Botón de WhatsApp': 'WhatsApp button',
    'Ubicación en Google Maps': 'Google Maps location',
    'Para negocios que quieren crecer.': 'For businesses that want to grow.',
    'Hasta 5 páginas': 'Up to 5 pages',
    'Formulario de contacto': 'Contact form',
    'SEO local básico': 'Basic local SEO',
    'Informe mensual de visitas': 'Monthly traffic report',
    'Para varias sedes y más contenido.': 'For several locations and more content.',
    'Hasta 10 páginas y blog': 'Up to 10 pages and a blog',

    'Pedidos en línea para restaurantes.': 'Online ordering for restaurants.',
    'Para empezar a vender en línea.': 'To start selling online.',
    'Menú o catálogo en línea': 'Online menu or catalog',
    'Pedidos por WhatsApp': 'Orders through WhatsApp',
    'Para restaurantes que quieren crecer.': 'For restaurants that want to grow.',
    'Pedidos en línea con pago': 'Online orders with payment',
    'Avisos de pedido por WhatsApp': 'Order alerts through WhatsApp',
    'Informe mensual de ventas': 'Monthly sales report',
    'Para varias sedes y más pedidos.': 'For several locations and more orders.',

    'Reservas directas para fincas y alojamientos.': 'Direct bookings for country houses and lodgings.',
    'Para empezar a recibir reservas directas.': 'To start taking direct bookings.',
    'Calendario de disponibilidad': 'Availability calendar',
    'Solicitudes de reserva': 'Booking requests',
    '1 propiedad o tipo de unidad': '1 property or unit type',
    'Para alojamientos que quieren crecer.': 'For lodgings that want to grow.',
    'Hasta 5 unidades': 'Up to 5 units',
    'Anticipos en línea': 'Online deposits',
    'Mensajes a huéspedes por WhatsApp': 'WhatsApp messages to guests',
    'Informe mensual de ocupación': 'Monthly occupancy report',
    'Para varias propiedades y más reservas.': 'For several properties and more bookings.',
    'Varias propiedades': 'Several properties',

    'Un portal para conjuntos residenciales y edificios.': 'A portal for residential complexes and buildings.',
    'Para empezar a gestionar el conjunto en línea.': 'To start managing your complex online.',
    'Portal del conjunto': 'Complex portal',
    'Avisos y documentos': 'Notices and documents',
    'Reserva de zonas comunes': 'Common area booking',
    'Para conjuntos que quieren hacer todo en línea.': 'For complexes that want to do everything online.',
    'Solicitudes en línea (PQRS)': 'Online requests (PQRS)',
    'Avisos por WhatsApp': 'WhatsApp notices',
    'Informe mensual': 'Monthly report',
    'Para varias torres o conjuntos.': 'For several towers or complexes.',
    'Para varias torres o conjuntos': 'For several towers or complexes',

    'Software a la medida de su negocio.': 'Software built for your business.',
    'Proyecto a medida': 'Custom project',
    'Definimos el alcance con usted y le enviamos una propuesta escrita.': 'We define the scope with you and send you a written proposal.',
    'Para clientes en Estados Unidos también trabajamos por horas.': 'For clients in the United States we also work by the hour.',
    'Cotizar mi proyecto': 'Get a quote for my project',
    'Todos los planes incluyen su propio dominio, hosting, actualizaciones de seguridad, una copia de seguridad mensual y soporte.': 'Every plan includes your own domain, hosting, security updates, a monthly backup and support.',
    'Permanencia mínima de 12 meses · Precios en COP + IVA (19 %)': '12-month minimum term · Prices in COP + VAT (19%)',

    // Add-ons and bundles
    'Complementos': 'Add-ons',
    'Agréguelos a cualquier plan.': 'Add them to any plan.',
    'Facturación electrónica DIAN': 'DIAN electronic invoicing',
    'Disponible próximamente; aún no se puede contratar.': 'Available soon; it cannot be ordered yet.',
    'Recepcionista IA (asistente por WhatsApp)': 'AI receptionist (WhatsApp assistant)',
    'Contenido para redes sociales (4 publicaciones al mes)': 'Social media content (4 posts a month)',
    'Mensajes adicionales de marketing por WhatsApp': 'Additional WhatsApp marketing messages',
    'Costo + 30 %': 'Cost + 30%',
    'Pagos con tarjeta y QR': 'Card and QR payments',
    'Tarifa de la pasarela, al costo': 'Payment gateway fee, at cost',
    'Paquetes por sector': 'Industry bundles',
    'Un plan y sus complementos, a un precio menor.': 'A plan and its add-ons, for less.',
    'Clínica Completa': 'Complete Clinic',
    'Agenda Crece + Facturación DIAN + Recepcionista IA': 'Calendar Grow + DIAN invoicing + AI receptionist',
    'La facturación electrónica DIAN se activará cuando esté disponible.': 'DIAN electronic invoicing will be switched on when it is available.',
    'Finca Directa': 'Direct Stays',
    'Reservas Crece + Contenido para redes': 'Bookings Grow + Social media content',
    'Restaurante Propio': 'Own Restaurant',
    'Pedidos Crece + Facturación DIAN + Contenido para redes': 'Orders Grow + DIAN invoicing + Social media content',
    'Conjunto Conectado': 'Connected Complex',
    'Comunidad Crece + una Asamblea Virtual al año': 'Community Grow + one Virtual Assembly a year',
    'Precio de Comunidad Crece': 'Community Grow price',

    // Payment and FAQ
    'Forma de pago': 'How payment works',
    'Usted paga una puesta en marcha única y una mensualidad.': 'You pay a one-time setup and a monthly fee.',
    'El pago inicial, que es la puesta en marcha más su primera mensualidad, se paga completo antes de empezar.': 'The first payment, the setup plus your first monthly fee, is paid in full before we start.',
    'Después, la mensualidad se paga el día 1 de cada mes.': 'After that, the monthly fee is paid on the 1st of each month.',
    'La mensualidad cubre hosting, seguridad, copias de seguridad, los cambios mensuales de su plan y soporte.': 'The monthly fee covers hosting, security, backups, your plan’s monthly changes and support.',
    'Permanencia mínima de 12 meses.': '12-month minimum term.',
    'Precios en pesos colombianos (COP) + IVA (19 %).': 'Prices in Colombian pesos (COP) + VAT (19%).',
    'Su dominio y sus datos son suyos.': 'Your domain and your data are yours.',
    'Sin comisión por cita, pedido ni reserva.': 'No fee per appointment, order or booking.',
    'Usted trabaja directamente con el equipo que construye su sitio.': 'You work directly with the team that builds your site.',
    'Preguntas frecuentes': 'Frequently asked questions',
    '¿Qué cubre la puesta en marcha?': 'What does the setup cover?',
    'El diseño, la configuración y la puesta en marcha de su sitio con la plantilla de su sector: sus servicios, horarios, fotos y textos, la conexión de su dominio y las pruebas antes del lanzamiento.': 'The design, configuration and launch of your site with your industry’s template: your services, hours, photos and texts, connecting your domain, and testing before launch.',
    '¿Qué incluye la mensualidad?': 'What does the monthly fee include?',
    'Hosting, actualizaciones de seguridad, una copia de seguridad mensual, soporte y los cambios mensuales incluidos en su plan.': 'Hosting, security updates, a monthly backup, support and the monthly changes included in your plan.',
    '¿De quién son el dominio y los datos?': 'Who owns the domain and the data?',
    'Suyos. El dominio queda a nombre de su negocio y puede pedir una copia de sus datos cuando quiera.': 'You do. The domain is registered to your business and you can ask for a copy of your data at any time.',
    '¿Puedo cambiar de plan?': 'Can I change plans?',
    'Sí. Puede subir de plan cuando quiera y el cambio se refleja en la siguiente mensualidad. Para bajar de plan, escríbanos y lo revisamos según su permanencia.': 'Yes. You can upgrade at any time and the change shows on your next monthly fee. To downgrade, write to us and we will review it against your minimum term.',
    '¿Cómo se paga?': 'How do I pay?',
    'Antes de empezar, usted hace un solo pago con la puesta en marcha y su primera mensualidad. Después, la mensualidad se paga el día 1 de cada mes.': 'Before we start, you make a single payment for the setup and your first monthly fee. After that, the monthly fee is paid on the 1st of each month.',
    '¿Los precios incluyen IVA?': 'Do the prices include VAT?',
    'No. Todos los precios están en pesos colombianos y no incluyen IVA (19 %).': 'No. All prices are in Colombian pesos and do not include VAT (19%).',
    '¿No sabe cuál elegir?': 'Not sure which one to choose?',
    'Cuéntenos sobre su negocio y le recomendamos el plan indicado.': 'Tell us about your business and we will recommend the right plan.',
    'Hablar con nosotros': 'Talk to us',

    // Request form
    'Solicitar información': 'Request information',
    'Cuéntenos cómo contactarle y le escribimos.': 'Tell us how to reach you and we will write to you.',
    'Plan': 'Plan',
    'Ayuda para elegir un plan': 'Help choosing a plan',
    'Nombre': 'Name',
    '(obligatorio)': '(required)',
    'Negocio': 'Business',
    'El nombre de su negocio, su Instagram o su sitio web.': 'Your business name, its Instagram or its website.',
    'Indique al menos un medio de contacto: teléfono o correo.': 'Give at least one way to reach you: phone or email.',
    'Teléfono o WhatsApp': 'Phone or WhatsApp',
    'Correo electrónico': 'Email',
    'Ciudad': 'City',
    'Mensaje': 'Message',
    'Apodo': 'Nickname',
    'Autorizo a GTL AI a tratar mis datos para responder esta solicitud y hacer seguimiento comercial, según la': 'I authorize GTL AI to process my data to answer this request and follow up commercially, under its',
    'política de tratamiento de datos personales': 'personal data policy (in Spanish)',
    '(abre en una pestaña nueva)': '(opens in a new tab)',
    'Reintentar': 'Try again',
    'Escribir por WhatsApp': 'Write on WhatsApp',
    '(abre WhatsApp en una pestaña nueva)': '(opens WhatsApp in a new tab)',
    'Enviar solicitud': 'Send request',
    'Cancelar': 'Cancel',
    'Recibimos su solicitud': 'We received your request',
    'Le respondemos el mismo día hábil. Si prefiere, también puede escribirnos por WhatsApp.': 'We reply the same business day. If you prefer, you can also write to us on WhatsApp.',
    'Cerrar': 'Close',
    'Autorización': 'Authorization',
    'La política de privacidad se actualizó. Recargue la página para continuar.': 'The privacy policy has been updated. Reload the page to continue.',
    'No pudimos registrar su solicitud. Puede intentarlo de nuevo o escribirnos por WhatsApp.': 'We could not save your request. You can try again or write to us on WhatsApp.',
    'No pudimos enviar su solicitud por un problema de conexión. Sus datos siguen aquí: puede reintentar o escribirnos por WhatsApp.': 'We could not send your request because of a connection problem. Your details are still here: you can try again or write to us on WhatsApp.',
    'El servicio no está disponible en este momento. Sus datos siguen aquí: puede reintentar en unos segundos o escribirnos por WhatsApp.': 'The service is not available right now. Your details are still here: you can try again in a few seconds or write to us on WhatsApp.',
    'Recibimos varias solicitudes suyas en poco tiempo. Espere unos minutos e inténtelo de nuevo, o escríbanos por WhatsApp.': 'We received several requests from you in a short time. Wait a few minutes and try again, or write to us on WhatsApp.',
    'Revise los campos marcados:': 'Check the marked fields:',
    'Enviando…': 'Sending…',
    'Indique un teléfono o un correo electrónico.': 'Give a phone number or an email address.',
    'Marque la casilla de autorización para continuar.': 'Tick the authorization box to continue.',
    'Elija un plan de la lista.': 'Choose a plan from the list.',
    'Escriba su nombre.': 'Write your name.',
    'Revise su nombre.': 'Check your name.',
    'Indique el nombre de su negocio, su Instagram o su sitio web.': 'Give your business name, its Instagram or its website.',
    'Revise el nombre de su negocio.': 'Check your business name.',
    'Revise el teléfono: solo números, espacios, paréntesis, guiones y el signo +, entre 7 y 20 caracteres.': 'Check the phone number: only digits, spaces, parentheses, hyphens and the + sign, 7 to 20 characters.',
    'Revise el correo electrónico; por ejemplo, nombre@dominio.com.': 'Check the email address; for example, name@domain.com.',
    'Revise la ciudad.': 'Check the city.',
    'Revise el mensaje.': 'Check the message.',
    'El nombre': 'Your name',
    'El nombre del negocio': 'The business name',
    'El teléfono': 'The phone number',
    'El correo': 'The email address',
    'La ciudad': 'The city',
    'El mensaje': 'The message',

    // Team, roadmap, footer
    'Equipo fundador': 'Founding Team',
    'Las personas que construyen GTL AI desde cero.': 'The people building GTL AI from the ground up.',
    'Director ejecutivo (CEO)': 'Chief Executive Officer',
    'Director financiero (CFO)': 'Chief Financial Officer',
    'Director de datos (CDO)': 'Chief Data Officer',
    'Director de tecnología (CTO)': 'Chief Technology Officer',
    'Metas': 'Goals',
    'Trayectoria': 'Background',
    'Posicionar a GTL AI como una empresa que define su categoría, uniendo una visión ambiciosa con una ejecución disciplinada: crecer sin perder una cultura de compromiso e impacto.': 'Position GTL AI as a category-defining company by pairing bold vision with disciplined execution — expanding our footprint while staying true to a culture of ownership and impact.',
    'Construir una base financiera lo bastante sólida para sostener la innovación a largo plazo: asegurar el capital y la infraestructura que GTL AI necesita para crecer sin perder la disciplina.': 'Build a financial foundation strong enough to support long-term innovation — securing the capital and infrastructure GTL AI needs to grow without compromising discipline.',
    'Convertir los datos en la ventaja competitiva más duradera de GTL AI: sistemas de inteligencia propios que se vuelven más inteligentes y valiosos con el tiempo.': "Turn data into GTL AI's most durable competitive advantage — building proprietary intelligence systems that get smarter and more valuable over time.",
    'Construir la base técnica de una generación de productos de IA rápidos, confiables y realmente inteligentes, diseñados para rendir al nivel de los mejores de la industria.': 'Build the technical foundation for a generation of AI products that are fast, reliable, and genuinely intelligent — engineered to perform at industry-leading standards.',
    'Clientes reales creando su sueño con nosotros': 'Real clients building their dream with us',
    'Una pequeña inversión con retorno inmediato en más clientes y mejor gestión.': 'A small investment with an immediate return: more customers and better management.',
    'Pausar logos': 'Pause logos',
    'Reanudar logos': 'Play logos',
    'Historias de clientes': 'Customer stories',
    'Fisioterapia': 'Physiotherapy',
    'Clínica dental': 'Dental clinic',
    'Peluquería y barbería': 'Hair salon & barbershop',
    'Estudio de tatuajes': 'Tattoo studio',
    'Restaurante': 'Restaurant',
    'Fisioterapia · Alba Fisioterapia': 'Physiotherapy · Alba Fisioterapia',
    'Clínica dental · Sonríe Dental': 'Dental clinic · Sonríe Dental',
    'Peluquería y barbería · Barbería El Bigote': 'Hair salon & barbershop · Barbería El Bigote',
    'Estudio de tatuajes · Tinta Norte': 'Tattoo studio · Tinta Norte',
    'Restaurante · La Fonda de Rosita': 'Restaurant · La Fonda de Rosita',
    '“El tiempo que se me iba organizando citas, respondiendo a pacientes y haciendo reservas ahora lo dedico a mi consulta y a lo que sé hacer.”': '“The time I used to lose organizing appointments, answering patients and taking bookings now goes into my practice and what I do best.”',
    'Directora · Alba Fisioterapia': 'Director · Alba Fisioterapia',
    'Alba no tenía sistema de agendamiento: las citas se llevaban por WhatsApp y en un cuaderno.': 'Alba had no booking system: appointments lived in WhatsApp chats and a notebook.',
    'Ahora tiene reservas automáticas desde su página web, de día y de noche.': 'Now patients book automatically from its website, day and night.',
    'Analiza su desempeño financiero y por paciente, mes a mes, en un solo panel.': 'It tracks its finances and each patient’s history, month by month, in one dashboard.',
    '“Los pacientes reservan en la noche desde el celular y en la mañana ya tengo el día organizado. Mi equipo dejó de vivir pegado al teléfono.”': '“Patients book at night from their phones, and by morning my day is already organized. My team is no longer glued to the phone.”',
    'Odontólogo y director · Sonríe Dental': 'Dentist and director · Sonríe Dental',
    'Sonríe Dental tenía dos sedes y una agenda en Excel para cada una.': 'Sonríe Dental had two locations and a separate Excel calendar for each.',
    'Las dos sedes comparten una sola agenda en línea, con la historia de cada paciente a un clic.': 'Both locations share one online calendar, with each patient’s history one click away.',
    'Ve en un mismo panel cuánto factura cada sede y cada tratamiento.': 'One dashboard shows the revenue of each location and each treatment.',
    '“Los clientes ya no tienen que llamar ni esperar respuesta: escogen barbero y hora, y llegan. Los sábados ya no se me cruzan los turnos.”': '“Clients no longer have to call or wait for an answer: they pick a barber and a time, and they show up. Saturdays are no longer double-booked.”',
    'Dueño · Barbería El Bigote': 'Owner · Barbería El Bigote',
    'El Bigote tomaba los turnos por Instagram y cada fin de semana se cruzaban horarios.': 'El Bigote took appointments over Instagram, and every weekend some of them overlapped.',
    'Cada barbero tiene su agenda y los clientes reservan solos desde la página.': 'Each barber has a calendar, and clients book themselves from the website.',
    'Cobra con tarjeta, Nequi o efectivo, y cada venta queda registrada con su barbero.': 'It takes card, Nequi or cash, and every sale is recorded with its barber.',
    '“En una sesión no puedo soltar la máquina para contestar mensajes. Ahora las citas me llegan con la idea del diseño y la zona, sin que yo tenga que responder.”': '“In a session I can’t put the machine down to answer messages. Now bookings arrive with the design idea and the placement, without me having to reply.”',
    'Tatuadora y fundadora · Tinta Norte': 'Tattoo artist and founder · Tinta Norte',
    'Tinta Norte coordinaba diseños, fechas y precios por chat, cliente por cliente.': 'Tinta Norte arranged designs, dates and prices over chat, one client at a time.',
    'Sus clientes reservan la sesión y envían la referencia del diseño desde la página.': 'Clients book their session and send their design reference from the website.',
    'Su portafolio en la página le trae clientes nuevos que la encuentran en Google.': 'Its portfolio on the website brings in new clients who find it on Google.',
    '“Antes el teléfono no paraba a la hora del almuerzo. Ahora los pedidos llegan organizados, con la dirección y el pago hechos.”': '“The phone used to ring nonstop at lunchtime. Now orders arrive organized, with the address and the payment already done.”',
    'Dueña · La Fonda de Rosita': 'Owner · La Fonda de Rosita',
    'La Fonda tomaba los domicilios por teléfono y los anotaba a mano.': 'La Fonda took delivery orders by phone and wrote them down by hand.',
    'Sus clientes piden desde el menú en línea y pagan al hacer el pedido.': 'Customers order from the online menu and pay as they order.',
    'Sabe qué platos se venden más y a qué horas, mes a mes.': 'It knows which dishes sell best and at what times, month by month.',
    'Menos tiempo administrativo, más tiempo en su negocio y lo que haces mejor': 'Less admin time, more time for your business and what you do best',
    'Escoge': 'Pick',
    'TU': 'YOUR',
    'negocio': 'business',
    '15 tipos de negocio': '15 kinds of business',
    'Escoge TU negocio': 'Pick YOUR business',
    'Elija su tipo de negocio y vea lo que GTL AI hace por usted.': 'Choose your kind of business and see what GTL AI does for you.',
    'Tipo de negocio': 'Kind of business',
    '¿Su negocio no está en la lista?': 'Your business is not on the list?',
    'Cuéntenos su sueño y armamos la solución a su medida, con lo que su negocio necesita.': 'Tell us about your dream and we will build a solution around what your business needs.',
    'Cuéntenos su sueño': 'Tell us your dream',
    'Agenda y pagos': 'Scheduling & payments',
    'Clientes': 'Client relationships',
    'Marketing y automatización': 'Marketing & automation',
    'Gestión': 'Management',
    'Agenda del equipo': 'Team calendar',
    'Clases y cupos': 'Classes & spots',
    'Reserva de mesas': 'Table reservations',
    'Pedidos en línea': 'Online orders',
    'Pagos y caja': 'Payments & point of sale',
    'Fichas de clientes': 'Client records',
    'Historia clínica': 'Clinical records',
    'Fichas de mascotas': 'Pet records',
    'Portal de residentes': 'Residents\' portal',
    'Mensajes y WhatsApp': 'Messages & WhatsApp',
    'Recordatorios por WhatsApp': 'WhatsApp reminders',
    'Aviso de prenda lista': '"Ready for pickup" alerts',
    'Planes y paquetes': 'Memberships & packages',
    'Portafolio de trabajos': 'Work portfolio',
    'Domicilios': 'Deliveries',
    'Solicitudes PQRS': 'Requests and complaints (PQRS)',
    'Perfil de Empresa en Google': 'Google Business Profile',
    'Contenido para redes': 'Social media content',
    'Campañas por WhatsApp': 'WhatsApp campaigns',
    'Reseñas de clientes': 'Customer reviews',
    'Recepcionista IA': 'AI receptionist',
    'Inventario': 'Inventory',
    'Seguimiento de pedidos': 'Order tracking',
    'Gestión del equipo': 'Staff management',
    'Informes y métricas': 'Reports & metrics',
    'Veterinaria': 'Veterinary clinic',
    'Entrenador personal': 'Personal trainer',
    'Lavandería': 'Laundry',
    'Sastrería': 'Tailor shop',
    'Tienda comercial': 'Retail store',
    'Spa y estética': 'Spa & beauty',
    'Yoga y pilates': 'Yoga & pilates',
    'Finca y alojamiento': 'Country house & lodging',
    'Conjunto residencial': 'Residential complex',
    'Otro tipo de sueño': 'Another kind of dream',
    'Nosotros': 'About us',
    'Por qué nosotros': 'Why us',
    'Somos un equipo de ingenieros de software y contadores profesionales que decidió que las pequeñas empresas también merecen tecnología que impulse su negocio, a un costo bajo.': 'We are a team of professional software engineers and accountants who decided that small businesses also deserve technology that drives their business, at a low cost.',
    'Somos expertos en implementar esta tecnología a un precio asequible para pymes.': 'We are experts at putting this technology in place at a price small businesses can afford.',
    'Es una inversión para que usted dedique menos tiempo a las tareas operativas.': 'It is an investment so you spend less time on day-to-day operations.',
    'Y más tiempo a lo que mejor hace: su sueño y su negocio.': 'And more time on what you do best: your dream and your business.',
    'Jugador profesional de squash que vio la oportunidad de ayudar a deportistas, entrenadores y médicos deportivos en su negocio.': 'A professional squash player who saw the chance to help athletes, coaches and sports doctors with their businesses.',
    'Ingeniero de software con más de 10 años de experiencia.': 'A software engineer with more than 10 years of experience.',
    'Contador y asesor financiero con más de 10 años de experiencia. Te asesora en tener las cuentas al día y en organizar las finanzas de tu negocio.': 'An accountant and financial advisor with more than 10 years of experience. He helps you keep your books up to date and organize your business’s finances.',
    'Información general': 'General information',
    'Ingeniero de Sistemas de la Universidad de los Andes.': 'Systems Engineer from Universidad de los Andes.',
    'Hoy Senior Fullstack Developer en AgileEngine; antes en Kin + Carta, Anthology (Blackboard) y Trilogy.': 'Today a Senior Fullstack Developer at AgileEngine; previously at Kin + Carta, Anthology (Blackboard) and Trilogy.',
    'Microservicios': 'Microservices',
    'CFA Charterholder. Contador internacional y administrador de empresas de la Universidad de los Andes, con especialización en Estadística de la Universidad Nacional.': 'CFA charterholder. International accountant and business administrator from Universidad de los Andes, with a postgraduate diploma in Statistics from Universidad Nacional.',
    'Experiencia en PwC, Forte Group, IPG y Vivo: presupuestos, proyecciones financieras y análisis de inversiones.': 'Experience at PwC, Forte Group, IPG and Vivo: budgeting, financial forecasting and investment analysis.',
    'Contabilidad NIIF': 'IFRS accounting',
    'Modelos financieros': 'Financial modeling',
    'Ingeniero de Sistemas y Computación de la Universidad de los Andes; cursa una maestría en Ciencias de la Computación en Georgia Tech.': 'Systems and Computing Engineer from Universidad de los Andes; pursuing a master\'s in Computer Science at Georgia Tech.',
    'Hoy Senior Software Engineer en Amadeus; antes en Achievers, Twilio, Blackboard e IBM.': 'Today a Senior Software Engineer at Amadeus; previously at Achievers, Twilio, Blackboard and IBM.',
    'Campeón nacional de squash en Colombia.': 'National squash champion in Colombia.',
    'Estuvo entre los 10 mejores del ranking nacional de squash.': 'Formerly ranked in the top 10 of Colombia’s national squash ranking.',
    'Entrenador personal y entrenador de squash.': 'Personal trainer and squash coach.',
    'Recepcionista con IA': 'AI receptionist',
    'Pausar animación': 'Pause animation',
    'Reanudar animación': 'Play animation',
    'Un recepcionista con IA para tu negocio que organiza la agenda y hace reservas automáticas': 'An AI receptionist for your business that organizes your calendar and books appointments automatically',
    'Atiende a tus clientes y responde sus preguntas sobre citas y cambios. A ti te responde sobre tu desempeño financiero, te da resúmenes de tu calendario y te mantiene al día. Es tu asistente personal para tu negocio.': 'It serves your clients and answers their questions about bookings and changes. For you, it answers questions about your financial performance, sums up your calendar and keeps you up to date. It is your personal assistant for your business.',
    'Atiende a tus clientes': 'Serves your clients',
    'Te resume tu día': 'Sums up your day',
    'Te da la agenda': 'Gives you the agenda',
    'Cliente': 'Client',
    'Tú, el dueño': 'You, the owner',
    'por WhatsApp': 'on WhatsApp',
    'chat con Falco': 'chat with Falco',
    'TÚ': 'YOU',
    '¡Hola! ¿Tienen cita de fisioterapia el jueves en la tarde?': 'Hi! Do you have a physiotherapy slot on Thursday afternoon?',
    'El jueves tengo 3:15 p. m. o 5:30 p. m. con Camila. ¿Cuál te reservo?': 'On Thursday I have 3:15 p.m. or 5:30 p.m. with Camila. Which one should I book?',
    'A las 3:15, por favor.': '3:15, please.',
    'Listo: jueves 19 a las 3:15 p. m. Te llega la confirmación por WhatsApp.': 'Done: Thursday the 19th at 3:15 p.m. Your confirmation is on its way on WhatsApp.',
    'Cita agendada': 'Appointment booked',
    '¿Cómo va mi calendario hoy?': 'How is my calendar today?',
    'Hoy tienes 18 citas: 15 confirmadas, 2 por confirmar y 1 cancelación. Tu primer espacio libre es a las 2:00 p. m.': 'You have 18 appointments today: 15 confirmed, 2 to confirm and 1 cancellation. Your first free slot is at 2:00 p.m.',
    '¿Y cómo vamos en ventas?': 'And how are sales going?',
    'Llevas $ 2.340.000 hoy, 8 % más que el martes pasado.': 'You are at $ 2,340,000 today, 8% more than last Tuesday.',
    'Dame la agenda de hoy.': 'Give me today’s agenda.',
    'Esta es tu agenda de hoy:': 'Here is your agenda for today:',
    'Sofía Arango · Fisioterapia': 'Sofía Arango · Physiotherapy',
    'Mateo Cárdenas · Valoración': 'Mateo Cárdenas · Assessment',
    'María José Pérez · Fisioterapia': 'María José Pérez · Physiotherapy',
    'Daniel Ospina · Rehabilitación': 'Daniel Ospina · Rehabilitation',
    'y 14 citas más': 'and 14 more appointments',
    'Pruébalo tú mismo': 'Try it yourself',
    'Elige una pregunta y mira cómo responde Falco.': 'Pick a question and see how Falco answers.',
    'Demostración: respuestas de ejemplo con los datos de Alba, una clínica ficticia. Todavía no es la IA en vivo.': 'Demo: sample answers with data from Alba, a fictional clinic. It is not the live AI yet.',
    'Conversación de ejemplo con Falco': 'Sample conversation with Falco',
    '¡Hola! Soy Falco. Elige una pregunta y te respondo con los datos de ejemplo de Alba.': 'Hi! I’m Falco. Pick a question and I’ll answer with Alba’s sample data.',
    'Pregúntale a Falco:': 'Ask Falco:',
    'Día lleno: 21 citas y solo queda un espacio, a las 4:30 p. m. con Andrés. ¿Lo ofrezco a la lista de espera?': 'A full day: 21 appointments and only one slot left, at 4:30 p.m. with Andrés. Shall I offer it to the waiting list?',
    'Vas bien: 16 citas, todas confirmadas. Camila tiene la mañana completa y Valentina está libre desde las 3:00 p. m.': 'Looking good: 16 appointments, all confirmed. Camila is booked all morning and Valentina is free from 3:00 p.m.',
    'Hoy hay 14 citas. Dos pacientes pidieron cambiar de hora y ya los reubiqué; no tienes cruces.': 'There are 14 appointments today. Two patients asked to change their time and I have already moved them; nothing overlaps.',
    'Tienes 19 citas y 3 valoraciones de pacientes nuevos. La primera es a las 8:00 a. m. con Sofía Arango.': 'You have 19 appointments and 3 assessments for new patients. The first one is at 8:00 a.m. with Sofía Arango.',
    'Dame la agenda de mañana.': 'Give me tomorrow’s agenda.',
    'Mañana empiezas a las 8:00 a. m. con Mateo Cárdenas y terminas a las 6:00 p. m. Son 15 citas y el almuerzo está bloqueado de 12:00 a 1:00.': 'Tomorrow you start at 8:00 a.m. with Mateo Cárdenas and finish at 6:00 p.m. That is 15 appointments, with lunch blocked from 12:00 to 1:00.',
    'Mañana tienes 12 citas. La tarde está suave: hay tres espacios libres después de las 3:00 p. m.': 'You have 12 appointments tomorrow. The afternoon is light: there are three free slots after 3:00 p.m.',
    'Mañana: 17 citas, 2 clases de pilates llenas y una valoración nueva a las 10:30 a. m.': 'Tomorrow: 17 appointments, 2 full pilates classes and a new assessment at 10:30 a.m.',
    'Mañana es tu día más ocupado de la semana: 20 citas. Ya confirmé 18 de ellas.': 'Tomorrow is your busiest day of the week: 20 appointments. I have already confirmed 18 of them.',
    'Mañana tienes 13 citas. Daniel Ospina pidió pasar su cita de las 11:00 a las 4:00 p. m. ¿La muevo?': 'You have 13 appointments tomorrow. Daniel Ospina asked to move his from 11:00 to 4:00 p.m. Shall I move it?',
    '¿Cuánto vendí esta semana?': 'How much did I sell this week?',
    'Esta semana llevas $ 11.850.000, un 9 % más que la semana pasada. El mejor día fue el martes.': 'You are at $ 11,850,000 this week, 9% more than last week. Tuesday was the best day.',
    'Vas en $ 9.420.000 esta semana. Fisioterapia aporta el 58 % de las ventas.': 'You are at $ 9,420,000 this week. Physiotherapy brings in 58% of sales.',
    'Llevas $ 12.300.000 en 96 ventas. Tu ticket promedio subió a $ 128.000.': 'You are at $ 12,300,000 across 96 sales. Your average ticket rose to $ 128,000.',
    'Esta semana: $ 10.760.000. Te faltan $ 1.240.000 para igualar tu mejor semana del mes.': 'This week: $ 10,760,000. You are $ 1,240,000 away from matching your best week of the month.',
    '$ 8.990.000 hasta hoy, con 71 ventas. El 64 % se pagó con tarjeta o Nequi.': '$ 8,990,000 so far, across 71 sales. 64% was paid by card or Nequi.',
    '¿Quién no ha pagado?': 'Who has not paid yet?',
    'Tienes 2 ventas pendientes por $ 1.135.000: Laura Henao (paquete de 10 sesiones) y Carolina Zapata (abono del 50 %).': 'You have 2 unpaid sales for $ 1,135,000: Laura Henao (10-session package) and Carolina Zapata (50% deposit).',
    'Solo una: Laura Henao debe $ 1.080.000 de su paquete. Le envié el link de pago ayer. ¿Se lo recuerdo?': 'Just one: Laura Henao owes $ 1,080,000 for her package. I sent her the payment link yesterday. Shall I remind her?',
    'Hay 3 saldos pendientes que suman $ 640.000. El más antiguo es de hace 9 días.': 'There are 3 outstanding balances adding up to $ 640,000. The oldest is from 9 days ago.',
    'Hoy estás al día: no hay pagos pendientes. La última cuenta por cobrar se pagó esta mañana.': 'You are up to date today: nothing is unpaid. The last open balance was paid this morning.',
    'Faltan 4 pagos por $ 912.000. Dos son de pacientes con cita mañana; puedo cobrarles al llegar.': 'There are 4 payments missing for $ 912,000. Two are from patients with appointments tomorrow; I can charge them when they arrive.',
    '¿Cuándo debo pagar impuestos?': 'When do I have to pay taxes?',
    'Con el NIT de ejemplo de Alba, tu declaración de renta vence el 12 de mayo. Te aviso una semana antes.': 'With Alba’s example tax ID (NIT), your income tax return is due on May 12. I will remind you a week before.',
    'Lo más cercano es el IVA del bimestre: vence el 14 de enero según el NIT de ejemplo de Alba.': 'The closest one is the two-month VAT return: it is due on January 14 for Alba’s example tax ID (NIT).',
    'Este mes solo tienes la retención en la fuente, el día 16. La declaración de renta vence en mayo (fechas de ejemplo de Alba).': 'This month you only have the withholding tax, on the 16th. The income tax return is due in May (Alba’s example dates).',
    'Tu próximo vencimiento es el ICA de Bogotá, el 23 de enero. Ya tengo listo el resumen para tu contador (fechas de ejemplo).': 'Your next deadline is Bogotá’s ICA tax, on January 23. I already have the summary ready for your accountant (example dates).',
    'Tienes tres fechas este trimestre: retención el 16, IVA el 14 de enero y renta en mayo. Son fechas de ejemplo para el NIT de Alba.': 'You have three dates this quarter: withholding on the 16th, VAT on January 14 and income tax in May. These are example dates for Alba’s tax ID.',
    '¿Cuál es mi servicio más vendido?': 'What is my best-selling service?',
    'Fisioterapia: 142 sesiones este mes, el 58 % de tus ingresos. Le sigue el masaje terapéutico.': 'Physiotherapy: 142 sessions this month, 58% of your income. Therapeutic massage comes next.',
    'Este mes gana Fisioterapia con $ 17.040.000. Pilates clínico es el que más creció: 22 %.': 'Physiotherapy wins this month with $ 17,040,000. Clinical pilates grew the most: 22%.',
    'Tu servicio estrella es Fisioterapia. El paquete de 10 sesiones se vendió 9 veces este mes.': 'Your star service is Physiotherapy. The 10-session package sold 9 times this month.',
    'Fisioterapia va primero y Rehabilitación deportiva segundo. Juntos son 3 de cada 4 pesos que entran.': 'Physiotherapy is first and Sports rehabilitation second. Together they bring in 3 of every 4 pesos.',
    'Fisioterapia, con 38 sesiones esta semana. El masaje terapéutico se vende más los viernes.': 'Physiotherapy, with 38 sessions this week. Therapeutic massage sells best on Fridays.',
    '¿Tengo espacios libres el viernes?': 'Do I have free slots on Friday?',
    'Sí, 5 espacios: 8:15 y 10:45 a. m. con Camila, y 2:00, 4:30 y 5:15 p. m. con Andrés.': 'Yes, 5 slots: 8:15 and 10:45 a.m. with Camila, and 2:00, 4:30 and 5:15 p.m. with Andrés.',
    'El viernes quedan 3 espacios, todos en la tarde. ¿Los publico en tu página de reservas?': 'There are 3 slots left on Friday, all in the afternoon. Shall I publish them on your booking page?',
    'Solo uno: a las 11:30 a. m. con Valentina. El resto del viernes está lleno.': 'Just one: at 11:30 a.m. with Valentina. The rest of Friday is full.',
    'Tienes 7 espacios libres el viernes. La mañana está casi vacía; puede ser buen día para una promoción.': 'You have 7 free slots on Friday. The morning is almost empty; it could be a good day for a promotion.',
    'Sí: 4 espacios entre las 2:00 y las 5:00 p. m. Las clases de pilates del viernes ya están llenas.': 'Yes: 4 slots between 2:00 and 5:00 p.m. Friday’s pilates classes are already full.',
    '¿Cuántos clientes nuevos tuve este mes?': 'How many new clients did I get this month?',
    'Este mes llegaron 34 pacientes nuevos, 8 más que el mes pasado. 21 reservaron desde tu página web.': '34 new patients came this month, 8 more than last month. 21 booked from your website.',
    'Llevas 27 pacientes nuevos. La mayoría te encontró en Google buscando «fisioterapia en chicó».': 'You have 27 new patients so far. Most found you on Google searching for “fisioterapia en chicó”.',
    '41 pacientes nuevos este mes, tu mejor cifra del año. 6 de cada 10 ya agendaron su segunda cita.': '41 new patients this month, your best figure of the year. 6 in 10 have already booked a second appointment.',
    'Este mes: 29 nuevos. 12 llegaron recomendados por otros pacientes.': 'This month: 29 new ones. 12 came recommended by other patients.',
    'Tienes 31 pacientes nuevos y 19 ya compraron un paquete de sesiones.': 'You have 31 new patients, and 19 have already bought a session package.',
    'Historias': 'Stories',
    'Falco · Recepcionista IA': 'Falco · AI Receptionist',
    'Falco IA': 'Falco AI',
    'Animación: el carácter 夢, que significa sueño, cambia desde la escritura antigua hasta convertirse en el logo de GTL AI': 'Animation: the character 夢, which means dream, changes from ancient script into the GTL AI logo',
    'Reproducir animación': 'Play animation',
    'Nuestro logo': 'Our logo',
    'significa «sueño»': 'means “dream”',
    'Este carácter chino significa «sueño» y se escribe así desde hace más de 3.000 años. Los avances de la humanidad siempre fueron un sueño primero, y nosotros lo elegimos porque de eso se trata GTL AI: de impulsar tus sueños para hacerlos realidad.': 'This Chinese character means “dream” and has been written this way for more than 3,000 years. Humanity’s advances were always a dream first, and we chose it because that is what GTL AI is about: empowering your dreams to make them real.',
    'Nosotros nos encargamos de la parte técnica, financiera y operativa, mientras usted se enfoca en su negocio y en lo que mejor hace.': 'We take care of the technical, financial and operational side, while you focus on your business and what you do best.',
    'Quiero saber más': 'I want to know more',
    'Te responde un asesor el mismo día hábil.': 'An advisor gets back to you the same business day.',
    'Agendas una demostración en vivo para ver cómo funcionaría en tu negocio.': 'You book a live demo to see how it would work for your business.',
    'Déjenos sus datos': 'Leave us your details',
    'Cuéntenos sobre su negocio en un formulario corto y le escribimos.': 'Tell us about your business in a short form and we will write to you.',
    'Escríbanos al': 'Message us at',
    'y conversemos por chat.': 'and let’s chat.',
    'Abrir WhatsApp': 'Open WhatsApp',
    'Escríbanos a': 'Write to us at',
    'desde su correo.': 'from your email.',
    'Privacidad': 'Privacy',
    '© 2026 GTL AI. Todos los derechos reservados.': '© 2026 GTL AI. All rights reserved.'
  };

  // Names, initials and addresses read the same in both languages.
  ['GTL', 'AI', 'GTL AI', 'Pro', 'GM', 'JG', 'DR', 'DAR', 'Gary Mendez', 'Jesus David Garcia, CFA', 'LinkedIn', 'SA', 'Falco', '夢', 'Angular', 'Excel', 'FP&A', 'Flask', 'Google Cloud', 'Java', 'MongoDB', 'Node.js', 'PostgreSQL', 'Python', 'React', 'Ruby', 'SQL', 'Daniel Rengifo',
    'David Andres Ramirez', 'WhatsApp', 'Gmail', 'Outlook', 'garydmendez@gtl-ai.com', 'Alba Fisioterapia', 'Sonríe Dental',
    'Barbería El Bigote', 'Tinta Norte', 'La Fonda de Rosita', 'Natalia Herrera', 'Andrés Rojas', 'Julián Castaño', 'Mariana Gil',
    'Rosa Elvira Pardo', 'NH', 'AR', 'JC', 'MG', 'RP'].forEach(function (k) { EN[k] = k; });

  // Texts built from parts: the parts are looked up in the table.
  var PACKAGE = '(Agenda|Presencia|Pedidos|Reservas|Comunidad)';
  var TIER = '(Esencial|Crece|Pro)';
  var RULES = [
    [new RegExp('^' + PACKAGE + ' · ' + TIER + '$'), function (m) { return word(m[1]) + ' · ' + word(m[2]); }],
    [/^(\$ ?[\d.]+) \/ mes \+ IVA$/, function (m) { return m[1] + ' / month + VAT'; }],
    [/^(.+) debe tener al menos (\d+) caracteres\.$/, function (m) { return word(m[1]) + ' must be at least ' + m[2] + ' characters.'; }],
    [/^(.+) no puede superar los (\d+) caracteres\.$/, function (m) { return word(m[1]) + ' cannot be longer than ' + m[2] + ' characters.'; }],
    // A field's name and its message, in the form's list of errors.
    [/^([^:]+): (.+)$/, function (m) { var a = lookup(m[1]); var b = lookup(m[2]); return a && b ? a + ': ' + b : null; }]
  ];

  var OUT = {};
  Object.keys(EN).forEach(function (k) { OUT[EN[k]] = true; });

  function word(s) { return Object.prototype.hasOwnProperty.call(EN, s) ? EN[s] : s; }

  function lookup(text) {
    if (Object.prototype.hasOwnProperty.call(EN, text)) return EN[text];
    for (var i = 0; i < RULES.length; i++) {
      var m = text.match(RULES[i][0]);
      if (m) {
        var r = RULES[i][1](m);
        if (r) return r;
      }
    }
    return null;
  }

  var lang = 'es';
  var texts = new Map();    // text node -> its Spanish text
  var attrs = new Map();    // element -> { attribute: Spanish value }
  var langs = new Map();    // element -> its own lang attribute in Spanish
  var ATTRS = ['aria-label', 'alt', 'title', 'placeholder'];
  var OFF = '[data-i18n="off"], script, style, noscript';
  var applying = false;
  var missing = [];         // Spanish texts with no English, for the tests

  var isOff = function (el) { return !el || !!el.closest(OFF); };
  var norm = function (v) { return v.replace(/\s+/g, ' ').trim(); };

  function textNode(n) {
    if (isOff(n.parentElement)) return;
    var value = n.nodeValue;
    var t = norm(value);
    if (!t || !/\p{L}/u.test(t) || OUT[t]) return;
    var en = lookup(t);
    if (en === null) {
      if (missing.indexOf(t) < 0) missing.push(t);
      return;
    }
    OUT[en] = true;
    texts.set(n, value);
    n.nodeValue = value.match(/^\s*/)[0] + en + value.match(/\s*$/)[0];
  }

  function attribute(el, name) {
    var v = el.getAttribute(name);
    if (!v || isOff(el)) return;
    var t = norm(v);
    if (OUT[t] || !/\p{L}/u.test(t)) return;
    var en = lookup(t);
    if (en === null) {
      if (missing.indexOf(t) < 0) missing.push(t);
      return;
    }
    OUT[en] = true;
    var saved = attrs.get(el) || {};
    saved[name] = v;
    attrs.set(el, saved);
    el.setAttribute(name, en);
  }

  function walk(root) {
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1 || isOff(root)) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var n;
    var list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(textNode);
    [root].concat([].slice.call(root.querySelectorAll('*'))).forEach(function (el) {
      ATTRS.forEach(function (a) { if (el.hasAttribute(a)) attribute(el, a); });
      // Links with an English version: a WhatsApp message or an email subject in English.
      var href = el.getAttribute('data-en-href');
      if (href && !isOff(el)) {
        var keep = attrs.get(el) || {};
        keep.href = el.getAttribute('href');
        attrs.set(el, keep);
        el.setAttribute('href', href);
      }
      var l = el.getAttribute('lang');
      if (l && /^es/.test(l) && !isOff(el)) {
        langs.set(el, l);
        el.setAttribute('lang', 'en');
      }
    });
  }

  var head = { title: null, description: null };
  var description = document.querySelector('meta[name="description"]');

  function toEnglish() {
    applying = true;
    html.setAttribute('lang', 'en');
    walk(document.body);
    head.title = document.title;
    var t = lookup(norm(document.title));
    if (t) document.title = t;
    if (description) {
      head.description = description.getAttribute('content');
      var d = lookup(norm(head.description));
      if (d) description.setAttribute('content', d);
    }
    applying = false;
  }

  function toSpanish() {
    applying = true;
    html.setAttribute('lang', 'es-CO');
    texts.forEach(function (value, n) { n.nodeValue = value; });
    attrs.forEach(function (saved, el) { Object.keys(saved).forEach(function (a) { el.setAttribute(a, saved[a]); }); });
    langs.forEach(function (l, el) { el.setAttribute('lang', l); });
    texts.clear();
    attrs.clear();
    langs.clear();
    if (head.title !== null) document.title = head.title;
    if (description && head.description !== null) description.setAttribute('content', head.description);
    applying = false;
  }

  // While English is on, whatever the page's scripts write in Spanish is translated before it is painted.
  var observer = new MutationObserver(function (records) {
    if (lang !== 'en' || applying) return;
    applying = true;
    records.forEach(function (r) {
      if (r.type === 'characterData') textNode(r.target);
      else if (r.type === 'attributes') attribute(r.target, r.attributeName);
      else [].forEach.call(r.addedNodes, walk);
    });
    applying = false;
  });

  // ---------- The switch ----------

  var box = document.querySelector('[data-lang-switch]');
  var current = box && box.querySelector('[data-lang-current]');
  var menu = box && box.querySelector('.lang-menu');
  var options = box ? [].slice.call(box.querySelectorAll('[data-lang]')) : [];

  function paintSwitch() {
    [].forEach.call(document.querySelectorAll('[data-lang-note]'), function (n) { n.hidden = lang !== 'en'; });
    if (!box) return;
    box.setAttribute('data-active', lang);
    current.setAttribute('aria-label', lang === 'en' ? 'Language: English. Change language' : 'Idioma: español. Cambiar idioma');
    options.forEach(function (o) {
      if (o.getAttribute('data-lang') === lang) o.setAttribute('aria-current', 'true');
      else o.removeAttribute('aria-current');
    });
  }

  function setOpen(open) {
    if (!box) return;
    menu.hidden = !open;
    current.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function setLang(next, remember) {
    next = next === 'en' ? 'en' : 'es';
    if (remember) {
      try { localStorage.setItem(KEY, next); } catch (err) { /* private mode: this visit only */ }
    }
    if (next === lang) { paintSwitch(); return; }
    lang = next;
    if (lang === 'en') toEnglish();
    else toSpanish();
    paintSwitch();
    document.dispatchEvent(new CustomEvent('gtl:lang', { detail: lang }));
  }

  if (box) {
    current.addEventListener('click', function () { setOpen(menu.hidden); });
    options.forEach(function (o) {
      o.addEventListener('click', function () {
        setLang(o.getAttribute('data-lang'), true);
        setOpen(false);
        current.focus();
      });
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) {
        setOpen(false);
        current.focus();
      }
    });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) setOpen(false); });
    box.addEventListener('focusout', function (e) { if (e.relatedTarget && !box.contains(e.relatedTarget)) setOpen(false); });
  }

  var start = 'es';
  try {
    var asked = new URLSearchParams(location.search).get('lang');
    if (asked === 'en' || asked === 'es') localStorage.setItem(KEY, asked);
    start = localStorage.getItem(KEY) === 'en' ? 'en' : 'es';
  } catch (err) {
    start = /[?&]lang=en\b/.test(location.search) ? 'en' : 'es';
  }

  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  setLang(start, false);
  paintSwitch();
  html.classList.remove('i18n-pending');

  // has(): whether a Spanish text has its English, for the tests of texts that scripts add later.
  window.gtlI18n = { set: function (l) { setLang(l, true); }, get: function () { return lang; }, missing: missing,
    has: function (text) { return lookup(norm(text)) !== null; } };
})();
