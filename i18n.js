// Language switch: Spanish, English and French. The page is written in Spanish, the default and what loads
// without JavaScript; English and French replace each text from the tables below (EN and FR), looked up by
// its Spanish text with the spaces collapsed. That covers text nodes and the attributes people meet
// (aria-label, alt, title, placeholder), so the pricing and the request form that the build writes need no
// markup of their own. Text that scripts write later (the form's messages, the tour's Pause label) is caught
// by a MutationObserver, so this file loads after the other scripts. Parts marked data-i18n="off" stay as
// written: the Bogotá clinic's screens in the feature tour, the made-up businesses' sites and logos, the
// company's name and address. The choice is kept in localStorage; ?lang=es, ?lang=en or ?lang=fr in the
// address sets it too. "npm --prefix _dev run i18n:check" lists every text with no English or French.
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
    'Contáctenos': 'Get in Touch',
    'Software para impulsar su': 'Software for empowering your',
    'sueño': 'dream',
    'Agenda, reservas en línea, ventas y pagos en un solo lugar. Una plataforma completa, rápida, confiable, fácil de usar y que funciona en cualquier dispositivo.': 'Calendar, online booking, sales and payments in one place. A complete platform that is fast, reliable, easy to use, and works on any device.',

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

    // Pricing: plans and what the lists name
    'Presencia': 'Presence',
    'A medida': 'Custom',
    '(abre un formulario)': '(opens a form)',
    'Más elegido': 'Most popular',
    'A cotizar': 'Quote on request',
    'Próximamente': 'Coming soon',
    '1 cambio pequeño al mes': '1 small change a month',
    'Varias sedes': 'Several locations',
    'Soporte prioritario': 'Priority support',
    'Botón de WhatsApp': 'WhatsApp button',
    'Calendario de disponibilidad': 'Availability calendar',
    'Anticipos en línea': 'Online deposits',
    'Reserva de zonas comunes': 'Common area booking',
    'Facturación electrónica DIAN': 'DIAN electronic invoicing',

    // Payment and FAQ
    'Preguntas frecuentes': 'Frequently asked questions',
    '¿Puedo cambiar de plan?': 'Can I change plans?',
    '¿Cómo se paga?': 'How do I pay?',
    '¿Los precios incluyen IVA?': 'Do the prices include VAT?',
    'Sí. Los precios están en pesos colombianos e incluyen el IVA (19 %).': 'Yes. Prices are in Colombian pesos and include VAT (19%).',
    'Cada mes, el día 1.': 'Every month, on the 1st.',
    'Sin costo de instalación · Permanencia mínima de 12 meses · Precios en COP, IVA (19 %) incluido': 'No setup fee · 12-month minimum term · Prices in COP, VAT (19%) included',
    'Planes desde $ 100.000 al mes, IVA incluido': 'Plans from $ 100.000 a month, VAT included',
    'Hablar con nosotros': 'Talk to us',

    // Request form
    'Solicitar información': 'Request information',
    'Cuéntenos cómo contactarle y le escribimos.': 'Tell us how to reach you and we will write to you.',
    'Plan': 'Plan',
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
    'política de tratamiento de datos personales': 'personal data policy',
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

    // Team, logos, stories, the business picker, Falco, the logo's story and the pricing page
    'Equipo fundador': 'Founding Team',
    'Director ejecutivo (CEO)': 'Chief Executive Officer',
    'Director financiero (CFO)': 'Chief Financial Officer',
    'Director de tecnología (CTO)': 'Chief Technology Officer',
    'Trayectoria': 'Background',
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
    'Tu negocio en internet.': 'Your business online.',
    'Elegir Presencia': 'Choose Presence',
    'Tu agenda llena, sin llamadas.': 'A full calendar, without the phone calls.',
    'Todo lo de Presencia, y además:': 'Everything in Presence, plus:',
    'Elegir Agenda': 'Choose Calendar',
    'El control de tu negocio.': 'Your business under control.',
    'Todo lo de Agenda, y además:': 'Everything in Calendar, plus:',
    'Elegir Gestión': 'Choose Management',
    'Completo': 'Complete',
    'Todo, con tu asistente de IA.': 'Everything, with your AI assistant.',
    'Todo lo de Gestión, y además:': 'Everything in Management, plus:',
    'Elegir Completo': 'Choose Complete',
    'Desde Presencia': 'From Presence',
    'Desde Agenda': 'From Calendar',
    'Desde Gestión': 'From Management',
    '¿Hay costo de instalación?': 'Is there a setup fee?',
    'No. Solo pagas la mensualidad de tu plan; la puesta en marcha va por nuestra cuenta.': 'No. You only pay your plan’s monthly fee; onboarding is on us.',
    '¿Hay permanencia mínima?': 'Is there a minimum term?',
    'Sí, de 12 meses. Así podemos construir y configurar todo sin cobrarte al inicio.': 'Yes, 12 months. That is how we can build and set everything up without charging you up front.',
    'Sí. Puedes subir de plan cuando quieras y el cambio se refleja en tu siguiente mensualidad.': 'Yes. You can upgrade at any time and the change shows on your next monthly fee.',
    '¿Qué pasa con mis datos si cancelo?': 'What happens to my data if I cancel?',
    'Son tuyos. Te entregamos una copia y tu dominio sigue a tu nombre.': 'They are yours. We hand you a copy and your domain stays in your name.',
    '¿Necesito saber de tecnología?': 'Do I need to be good with technology?',
    'No. Nosotros lo montamos todo y te enseñamos a usarlo.': 'No. We set everything up and show you how to use it.',
    'Puesta en marcha gratis': 'Free onboarding',
    'Nosotros armamos tu página, configuramos tu sistema, pasamos tus datos y capacitamos a tu equipo. Sin costo.': 'We build your page, set up your system, move your data over and train your team. At no cost.',
    'Soporte de primer nivel': 'Top-tier support',
    'Hablas directamente con el equipo que construyó tu sistema. Te respondemos el mismo día hábil.': 'You talk directly to the team that built your system. We reply the same business day.',
    'Si te vas, te llevas tus datos': 'If you leave, you take your data with you',
    'Tu dominio y tus datos son tuyos. Si decides irte, te entregamos una copia completa.': 'Your domain and your data are yours. If you decide to leave, we hand you a full copy.',
    'Planes mensuales sin costo de instalación: página web, agenda, ventas, finanzas y Falco, tu recepcionista con IA. Precios en pesos colombianos.': 'Monthly plans with no setup fee: website, calendar, sales, finance and Falco, your AI receptionist. Prices in Colombian pesos.',
    'Precios | GTL AI': 'Pricing | GTL AI',
    'Precios': 'Pricing',
    'Precios sencillos para empresas que crecen': 'Simple pricing for growing businesses',
    'Un pago mensual, sin costo de instalación. Empieza con lo que necesitas hoy y sube de plan cuando tu negocio crezca.': 'One monthly payment, with no setup fee. Start with what you need today and upgrade as your business grows.',
    'Landing page con el estilo de tu negocio': 'A landing page in your business’s style',
    'SEO local para que te encuentren en Google': 'Local SEO so people find you on Google',
    'Dominio, hosting y seguridad incluidos': 'Domain, hosting and security included',
    'Botón de WhatsApp y formulario de contacto': 'WhatsApp button and contact form',
    'Agenda de todo tu equipo': 'A calendar for your whole team',
    'Reservas en línea, de día y de noche': 'Online booking, day and night',
    'Fichas de clientes con su historial': 'Client records with their history',
    'Ventas y pagos en un solo lugar': 'Sales and payments in one place',
    'Falco, tu recepcionista con IA': 'Falco, your AI receptionist',
    'Atiende y agenda a tus clientes por chat': 'Serves and books your clients over chat',
    'Resúmenes de tu agenda y tus finanzas': 'Summaries of your calendar and finances',
    '¿Solo necesitas algunas funciones? Elige las tuyas y armamos tu plan.': 'Only need some features? Pick yours and we will build your plan.',
    'Cotizar mi plan': 'Get a quote for my plan',
    'Todos los planes incluyen hosting, dominio, actualizaciones de seguridad, copias de seguridad y soporte.': 'Every plan includes hosting, a domain, security updates, backups and support.',
    'Todo lo que obtienes con GTL AI': 'Everything you get with GTL AI',
    'Landing page a tu medida': 'A landing page made for you',
    'SEO local': 'Local SEO',
    'Dominio y hosting': 'Domain and hosting',
    'Ingresos, gastos y utilidad': 'Income, expenses and profit',
    'Exportación para tu contador': 'Export for your accountant',
    'Cuentas por cobrar': 'Accounts receivable',
    'Ventas por servicio y por profesional': 'Sales by service and by professional',
    'Complementos opcionales': 'Optional add-ons',
    'Agrégalos a tu plan cuando los necesites.': 'Add them to your plan when you need them.',
    'Asesorías financieras y tributarias': 'Financial and tax advisory',
    'Con un contador público: revisa tus cuentas contigo, te ayuda a planear tus impuestos y a poner tus finanzas en orden.': 'With a certified public accountant: they review your books with you, help you plan your taxes and put your finances in order.',
    'Falco, chatbot con IA': 'Falco, AI chatbot',
    'Tu recepcionista con IA: atiende a tus clientes, agenda citas y te resume tu día. Ya viene incluido en el plan Completo.': 'Your AI receptionist: it serves your clients, books appointments and sums up your day. It is already included in the Complete plan.',
    'Con cada plan': 'With every plan',
    '¿GTL AI es para ti?': 'Is GTL AI right for you?',
    'Cuéntanos de tu negocio y te mostramos en vivo cómo funcionaría, sin compromiso.': 'Tell us about your business and we will show you live how it would work, with no commitment.',
    'Agendar una demostración': 'Book a demo',
    ', sin costo de instalación.': ', with no setup fee.',
    'Ver precios': 'See pricing',
    'Una página rápida, con el estilo de tu negocio, que se ve bien en cualquier celular.': 'A fast page in your business’s style that looks right on any phone.',
    'Preparamos tu página para que la gente cercana te encuentre cuando busca tu servicio en Google.': 'We set up your page so people nearby find you when they search for your service on Google.',
    'Mantenemos tu ficha de Google al día: horarios, fotos, ubicación y reseñas.': 'We keep your Google listing up to date: hours, photos, location and reviews.',
    'Tu propio dominio, hosting, seguridad y copias de seguridad incluidos, sin que tengas que configurar nada.': 'Your own domain, hosting, security and backups included, with nothing for you to set up.',
    'Tus clientes te escriben con un toque desde tu página.': 'Your clients message you with one tap from your page.',
    'La agenda de todos tus profesionales, por día o por semana, con colores por servicio.': 'Every professional’s calendar, by day or by week, color-coded by service.',
    'Tus clientes eligen servicio, profesional y hora, y la cita aparece sola en tu agenda.': 'Your clients pick the service, the professional and the time, and the appointment shows up in your calendar by itself.',
    'Clases grupales con cupos limitados y lista de espera.': 'Group classes with limited spots and a waiting list.',
    'Cobra con tarjeta, transferencia o efectivo y lleva la caja del día.': 'Take card, bank transfer or cash and keep track of the day’s till.',
    'Recibe pedidos desde tu menú o catálogo en línea.': 'Take orders from your online menu or catalog.',
    'Ve cuánto entra, cuánto sale y cuánto te queda, mes a mes.': 'See how much comes in, how much goes out and how much you keep, month by month.',
    'Informes de ventas, ocupación y clientes para decidir con datos.': 'Sales, occupancy and client reports, so you decide with data.',
    'Exporta tus movimientos en un archivo listo para tu contador.': 'Export your transactions in a file that is ready for your accountant.',
    'Sabe quién te debe, cuánto y desde cuándo.': 'Know who owes you, how much and since when.',
    'Emite facturas electrónicas válidas ante la DIAN desde la misma venta.': 'Issue electronic invoices valid with the DIAN (Colombia’s tax authority) straight from the sale.',
    'El historial de citas, pagos y notas de cada cliente en un solo lugar.': 'Each client’s history of appointments, payments and notes in one place.',
    'Todas las conversaciones con tus clientes en una sola bandeja.': 'Every conversation with your clients in one inbox.',
    'Vende paquetes de sesiones y membresías, y controla lo que queda por usar.': 'Sell session packages and memberships, and keep track of what is left to use.',
    'Pide una reseña después de cada cita y muéstralas en tu página.': 'Ask for a review after each appointment and show them on your page.',
    'Recordatorios automáticos antes de cada cita, para que falten menos.': 'Automatic reminders before each appointment, so fewer people miss theirs.',
    'Controla tus productos e insumos, con avisos cuando algo se está acabando.': 'Keep track of your products and supplies, with alerts when something is running low.',
    'Los horarios, los servicios y el desempeño de cada profesional.': 'Each professional’s hours, services and performance.',
    'Maneja todas tus sedes desde una sola cuenta.': 'Run all your locations from a single account.',
    'Sigue cada pedido desde que entra hasta que se entrega.': 'Follow every order from the moment it comes in until it is delivered.',
    'Descubre qué servicios y qué profesionales venden más.': 'Find out which services and which professionals sell the most.',
    'Abre una categoría y pasa por cada función para ver cómo se ve.': 'Open a category and move over each feature to see what it looks like.',
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
    // BF-W1: the footer, the team and Expertise-as-Software
    'Instagram de GTL AI': 'GTL AI on Instagram',
    'Director de operaciones (COO)': 'Chief Operating Officer',
    'Investigador y desarrollador de productos de IA': 'AI product researcher and developer',
    'PhD en arquitectura de diseño conversacional con IA': 'PhD in AI conversational design architecture',
    'Emprendedor en serie': 'Serial entrepreneur',
    'Exjugador de squash del PSA Challenger Tour': 'Former squash player on the PSA Challenger Tour',
    'Lidera nuestra sede en París y las operaciones de GTL AI. Ingeniero de software con más de 10 años de experiencia.': 'He leads our Paris office and GTL AI’s operations. A software engineer with more than 10 years of experience.',
    'Lidera la tecnología de GTL AI. Ingeniero de software con más de 10 años de experiencia.': 'He leads GTL AI’s technology. A software engineer with more than 10 years of experience.',
    'Expertise-as-Software: la evolución del SaaS': 'Expertise-as-Software: the evolution of SaaS',
    'El SaaS le vende una herramienta que usted tiene que aprender a usar. Con Expertise-as-Software, su conocimiento se convierte en el software. En GTL AI tomamos lo que usted sabe hacer y la forma en que atiende —sus servicios, sus horarios y sus reglas de reserva— y, con inteligencia artificial, lo convertimos en su propio software.': 'SaaS sells you a tool that you have to learn to use. With Expertise-as-Software, your knowledge becomes the software. At GTL AI we take what you know how to do and the way you serve your clients—your services, your hours and your booking rules—and, with artificial intelligence, we turn it into your own software.',
    'Nuestros paquetes de software incluyen los servicios de un equipo multidisciplinario de expertos en tecnología, inteligencia artificial, diseño web y marketing digital: Presencia, su página web con posicionamiento en Google; Agenda, sus citas y reservas en línea, las 24 horas; Gestión, sus ventas, finanzas e informes en un solo lugar; y Completo, todo lo anterior con Falco, nuestro recepcionista con inteligencia artificial. Como complemento, ofrecemos asesoría financiera y tributaria con contador público.': 'Our software packages include the services of a multidisciplinary team of experts in technology, artificial intelligence, web design and digital marketing: Presence, your website, with search positioning on Google; Calendar, your appointments and online booking, 24 hours a day; Management, your sales, finances and reports in one place; and Complete, all of the above with Falco, our AI receptionist. As an add-on, we offer financial and tax advisory with a certified public accountant.',
    'Es una forma innovadora de hacer negocios en la era de la IA, y somos pioneros en llevarla a Colombia y a toda Latinoamérica. Somos una empresa multinacional, con sede en Bogotá y en París, y existimos para una sola cosa: ayudarle a hacer realidad su sueño.': 'It is an innovative way of doing business in the age of AI, and we are pioneers in bringing it to Colombia and all of Latin America. We are a multinational company, with offices in Bogotá and Paris, and we exist for one thing only: to help you make your dream come true.',

    // BF-W1: prices with VAT included, and the note each pricing button leaves in the form
    '/ mes, IVA incluido': '/ month, VAT included',
    'Me interesa el plan Presencia.': 'I’m interested in the Presence plan.',
    'Me interesa el plan Agenda.': 'I’m interested in the Calendar plan.',
    'Me interesa el plan Gestión.': 'I’m interested in the Management plan.',
    'Me interesa el plan Completo.': 'I’m interested in the Complete plan.',
    'Quiero cotizar un plan a medida.': 'I’d like a quote for a custom plan.',
    'Quiero agendar una demostración.': 'I’d like to book a demo.',

    // BF-W1: the launch banner and the demos (shown while launch.enabled is true in _dev/site-config.json)
    'Lanzamiento': 'Launch',
    'Cerrar aviso': 'Close this notice',
    'Lanzamiento oficial este Black Friday, viernes 27 de noviembre.': 'Official launch this Black Friday, November 27.',
    'Vea las demos por especialidad.': 'See the demos by specialty.',
    'Ya estamos en vivo: sitios web con agenda en línea para cada especialidad.': 'We are live: websites with online scheduling for every specialty.',
    'Vea las demos.': 'See the demos.',
    'Demos por especialidad': 'Demos by specialty',
    'Sitios de muestra con agenda en línea, uno por especialidad. Los datos son de ejemplo.': 'Sample sites with online scheduling, one per specialty. The data is sample data. The demos are in Spanish.',
    'Ver demo': 'View demo',
    'Fisioterapia deportiva': 'Sports physiotherapy',
    'Odontología': 'Dentistry',
    'Estética': 'Aesthetics',
    'Nutrición': 'Nutrition',
    'Psicología': 'Psychology',
    'Para centros de fisioterapia y rehabilitación deportiva.': 'For sports physiotherapy and rehabilitation centers.',
    'Para consultorios de fisioterapia.': 'For physiotherapy practices.',
    'Para consultorios y clínicas odontológicas.': 'For dental practices and clinics.',
    'Para centros de estética.': 'For aesthetics centers.',
    'Para consultorios de nutrición.': 'For nutrition practices.',
    'Para consultorios de psicología.': 'For psychology practices.',
    'Para clínicas y consultorios veterinarios.': 'For veterinary clinics and practices.',

    // BF-W1: the privacy policy. A translation; the page says the Spanish version is the one that applies.
    'Política de tratamiento de datos personales': 'Personal data policy',
    '1. Responsable': '1. Data controller',
    'Correo:': 'Email:',
    '. Teléfono y WhatsApp:': '. Phone and WhatsApp:',
    '2. Qué datos recibimos': '2. What data we receive',
    'Cuando usted nos escribe por WhatsApp desde este sitio, recibimos su número, su nombre de perfil y lo que nos cuente en la conversación.': 'When you write to us on WhatsApp from this site, we receive your number, your profile name and whatever you tell us in the conversation.',
    'Cuando usa el formulario de solicitud, recibimos su nombre, el nombre de su negocio, su teléfono o correo, su ciudad, su mensaje y el plan que le interesa.': 'When you use the request form, we receive your name, your business’s name, your phone number or email, your city, your message and the plan you are interested in.',
    'No pedimos datos sensibles; por favor no los incluya.': 'We do not ask for sensitive data; please do not include any.',
    '3. Para qué los usamos': '3. What we use it for',
    'Para responder su solicitud, enviarle información y propuestas de nuestros planes, y hacer seguimiento comercial. No vendemos sus datos ni los usamos para otros fines sin pedirle autorización.': 'To answer your request, send you information and proposals about our plans, and follow up commercially. We do not sell your data or use it for other purposes without asking for your authorization.',
    '4. Autorización': '4. Authorization',
    'Tratamos sus datos con su autorización, que usted nos da al escribirnos por WhatsApp desde este sitio': 'We process your data with your authorization, which you give us by writing to us on WhatsApp from this site',
    'o al marcar la casilla de autorización del formulario': 'or by ticking the form’s authorization box',
    '5. Quién más los maneja': '5. Who else handles it',
    'Usamos proveedores que tratan datos por cuenta nuestra: WhatsApp (Meta) para las conversaciones, GitHub Pages para alojar este sitio (puede registrar datos técnicos, como su dirección IP) y nuestro proveedor de correo electrónico para recibir y responder sus solicitudes.': 'We use providers that process data on our behalf: WhatsApp (Meta) for the conversations, GitHub Pages to host this site (it may record technical data, such as your IP address) and our email provider to receive and answer your requests.',
    'Para el formulario de solicitud usamos además Railway, que aloja el servidor y la base de datos donde se guardan sus solicitudes, y Resend, que nos envía los correos de aviso de cada solicitud.': 'For the request form we also use Railway, which hosts the server and the database where your requests are stored, and Resend, which sends us the notification email for each request.',
    'Algunos de estos proveedores están fuera de Colombia, por lo que sus datos pueden almacenarse en otros países, con las medidas de seguridad de esos proveedores.': 'Some of these providers are outside Colombia, so your data may be stored in other countries, under those providers’ security measures.',
    '6. Sus derechos': '6. Your rights',
    'Según la Ley 1581 de 2012, usted puede:': 'Under Law 1581 of 2012, you may:',
    'conocer, actualizar y corregir sus datos;': 'know, update and correct your data;',
    'acceder a ellos en forma gratuita;': 'access it free of charge;',
    'pedir prueba de su autorización;': 'ask for proof of your authorization;',
    'saber cómo los hemos usado;': 'know how we have used it;',
    'revocar la autorización o pedir que los borremos, cuando no haya un deber legal o contractual de conservarlos;': 'withdraw your authorization or ask us to delete it, where there is no legal or contractual duty to keep it;',
    'presentar quejas ante la Superintendencia de Industria y Comercio (SIC).': 'file complaints with the Superintendencia de Industria y Comercio (SIC).',
    '7. Cómo ejercerlos': '7. How to exercise them',
    'con su nombre, cómo contactarle y su solicitud.': 'with your name, how to reach you and your request.',
    'Respondemos las consultas en un máximo de 10 días hábiles; si necesitamos más tiempo, le informamos antes el motivo y la nueva fecha, que no superará 5 días hábiles adicionales. Respondemos los reclamos en un máximo de 15 días hábiles, prorrogables hasta por 8 días hábiles más, también con aviso previo del motivo.': 'We answer inquiries within 10 business days at most; if we need more time, we tell you beforehand the reason and the new date, which will be no more than 5 additional business days. We answer claims within 15 business days at most, extendable by up to 8 more business days, also with prior notice of the reason.',
    '8. Cuánto tiempo los guardamos': '8. How long we keep it',
    'Hasta 24 meses desde nuestro último contacto, salvo que usted se convierta en cliente o la ley nos pida guardarlos más tiempo.': 'Up to 24 months from our last contact, unless you become a client or the law requires us to keep it longer.',
    '9. Vigencia': '9. Validity',
    'Versión': 'Version',
    ', vigente desde el': ', in force since',
    '. Si cambia, publicaremos la nueva versión en esta página.': '. If it changes, we will publish the new version on this page.',

    'Privacidad': 'Privacy',
    '© 2026 GTL AI. Todos los derechos reservados.': '© 2026 GTL AI. All rights reserved.'
  };

  // French: the same Spanish texts as EN, in the formal register (vous). Typed with plain spaces; the no-break
  // spaces French wants before ? ! : ; are added when a text is written (typo() below).
  var FR = {
    // Head
    'GTL AI | Impulsando sueños': 'GTL AI | Propulser les rêves',
    'Creamos la página web de su negocio con agenda, pedidos o reservas en línea. Planes con precios claros y soporte en Colombia.': 'Nous créons le site web de votre entreprise avec agenda, commandes ou réservations en ligne. Des formules aux prix clairs et une assistance en Colombie.',
    'Política de tratamiento de datos personales — GTL AI': 'Politique de traitement des données personnelles — GTL AI',

    // Header, hero
    'Funciones': 'Fonctions',
    'Contáctenos': 'Contact',
    'Software para impulsar su': 'Un logiciel pour propulser votre',
    'sueño': 'rêve',
    'Agenda, reservas en línea, ventas y pagos en un solo lugar. Una plataforma completa, rápida, confiable, fácil de usar y que funciona en cualquier dispositivo.': 'Agenda, réservations en ligne, ventes et paiements au même endroit. Une plateforme complète, rapide, fiable, facile à utiliser et qui fonctionne sur tous les appareils.',

    // Feature tour
    'Página web y SEO': 'Site web et SEO',
    'Agenda': 'Agenda',
    'Reservas en línea': 'Réservations en ligne',
    'Ventas y pagos': 'Ventes et paiements',
    'Finanzas y contabilidad': 'Finances et comptabilité',
    'Llamadas y mensajes': 'Appels et messages',
    'Pausar recorrido': 'Mettre la visite en pause',
    'Reanudar recorrido': 'Reprendre la visite',
    'Una página web que le trae pacientes': 'Un site web qui vous amène des patients',
    'Una página rápida que se ve bien en cualquier celular, preparada para que la gente cercana lo encuentre en Google y reserve con un toque.': 'Une page rapide, qui s’affiche bien sur tous les téléphones, conçue pour que les personnes à proximité vous trouvent sur Google et réservent d’un seul geste.',
    'Todo el día de su equipo de un vistazo': 'Toute la journée de votre équipe en un coup d’œil',
    'Las citas de cada profesional por día o por semana, con colores por servicio y los datos de cada paciente a un clic.': 'Les rendez-vous de chaque professionnel par jour ou par semaine, avec une couleur par service et les informations de chaque patient à un clic.',
    'Sus pacientes reservan solos, de día y de noche': 'Vos patients réservent eux-mêmes, de jour comme de nuit',
    'Su página web recibe reservas a toda hora: el paciente elige el servicio, el profesional y un horario libre, y la cita aparece de inmediato en su agenda.': 'Votre site web reçoit des réservations à toute heure : le patient choisit le service, le professionnel et un créneau libre, et le rendez-vous apparaît aussitôt dans votre agenda.',
    'Cobre en segundos, como sea que le paguen': 'Encaissez en quelques secondes, quel que soit le moyen de paiement',
    'Reciba tarjeta, transferencia o efectivo en recepción, o envíe un link de pago. Cada venta queda en una sola lista con su estado.': 'Acceptez la carte, le virement ou les espèces à l’accueil, ou envoyez un lien de paiement. Chaque vente figure dans une seule liste avec son statut.',
    'Sepa a dónde va cada peso': 'Sachez où va chaque peso',
    'Ingresos, gastos y utilidad mes a mes, con una exportación lista para su contador. La facturación electrónica DIAN llegará pronto.': 'Revenus, dépenses et bénéfice mois par mois, avec un export prêt pour votre comptable. La facturation électronique DIAN arrivera bientôt.',
    'Todas las conversaciones en una sola bandeja': 'Toutes les conversations dans une seule boîte de réception',
    'Mensajes de WhatsApp, SMS y llamadas perdidas junto al historial de cada paciente. Los recordatorios automáticos por WhatsApp llegarán pronto.': 'Messages WhatsApp, SMS et appels manqués à côté de l’historique de chaque patient. Les rappels automatiques par WhatsApp arriveront bientôt.',

    // Pricing: plans and what the lists name
    'Presencia': 'Présence',
    'A medida': 'Sur mesure',
    '(abre un formulario)': '(ouvre un formulaire)',
    'Más elegido': 'Le plus choisi',
    'A cotizar': 'Sur devis',
    'Próximamente': 'Bientôt disponible',
    '1 cambio pequeño al mes': '1 petite modification par mois',
    'Varias sedes': 'Plusieurs établissements',
    'Soporte prioritario': 'Assistance prioritaire',
    'Botón de WhatsApp': 'Bouton WhatsApp',
    'Calendario de disponibilidad': 'Calendrier des disponibilités',
    'Anticipos en línea': 'Acomptes en ligne',
    'Reserva de zonas comunes': 'Réservation des espaces communs',
    'Facturación electrónica DIAN': 'Facturation électronique DIAN',

    // Payment and FAQ. "IVA" is Colombian VAT: "TVA colombienne (IVA)".
    'Preguntas frecuentes': 'Questions fréquentes',
    '¿Puedo cambiar de plan?': 'Puis-je changer de formule ?',
    '¿Cómo se paga?': 'Comment se fait le paiement ?',
    '¿Los precios incluyen IVA?': 'Les prix incluent-ils la TVA colombienne (IVA) ?',
    'Sí. Los precios están en pesos colombianos e incluyen el IVA (19 %).': 'Oui. Les prix sont en pesos colombiens et incluent la TVA colombienne (IVA, 19 %).',
    'Cada mes, el día 1.': 'Chaque mois, le 1er.',
    'Sin costo de instalación · Permanencia mínima de 12 meses · Precios en COP, IVA (19 %) incluido': 'Sans frais d’installation · Engagement minimum de 12 mois · Prix en COP, TVA colombienne (IVA, 19 %) incluse',
    'Planes desde $ 100.000 al mes, IVA incluido': 'Formules à partir de $ 100.000 par mois, TVA colombienne (IVA) incluse',
    'Hablar con nosotros': 'Parler avec nous',

    // Request form
    'Solicitar información': 'Demander des informations',
    'Cuéntenos cómo contactarle y le escribimos.': 'Dites-nous comment vous joindre et nous vous écrirons.',
    'Plan': 'Formule',
    'Nombre': 'Nom',
    '(obligatorio)': '(obligatoire)',
    'Negocio': 'Entreprise',
    'El nombre de su negocio, su Instagram o su sitio web.': 'Le nom de votre entreprise, son Instagram ou son site web.',
    'Indique al menos un medio de contacto: teléfono o correo.': 'Indiquez au moins un moyen de contact : téléphone ou e-mail.',
    'Teléfono o WhatsApp': 'Téléphone ou WhatsApp',
    'Correo electrónico': 'E-mail',
    'Ciudad': 'Ville',
    'Mensaje': 'Message',
    'Apodo': 'Surnom',
    'Autorizo a GTL AI a tratar mis datos para responder esta solicitud y hacer seguimiento comercial, según la': 'J’autorise GTL AI à traiter mes données pour répondre à cette demande et assurer un suivi commercial, conformément à sa',
    'política de tratamiento de datos personales': 'politique de traitement des données personnelles',
    '(abre en una pestaña nueva)': '(s’ouvre dans un nouvel onglet)',
    'Reintentar': 'Réessayer',
    'Escribir por WhatsApp': 'Écrire sur WhatsApp',
    '(abre WhatsApp en una pestaña nueva)': '(ouvre WhatsApp dans un nouvel onglet)',
    'Enviar solicitud': 'Envoyer la demande',
    'Cancelar': 'Annuler',
    'Recibimos su solicitud': 'Nous avons bien reçu votre demande',
    'Le respondemos el mismo día hábil. Si prefiere, también puede escribirnos por WhatsApp.': 'Nous vous répondons le jour ouvrable même. Si vous préférez, vous pouvez aussi nous écrire sur WhatsApp.',
    'Cerrar': 'Fermer',
    'Autorización': 'Autorisation',
    'La política de privacidad se actualizó. Recargue la página para continuar.': 'La politique de confidentialité a été mise à jour. Rechargez la page pour continuer.',
    'No pudimos registrar su solicitud. Puede intentarlo de nuevo o escribirnos por WhatsApp.': 'Nous n’avons pas pu enregistrer votre demande. Vous pouvez réessayer ou nous écrire sur WhatsApp.',
    'No pudimos enviar su solicitud por un problema de conexión. Sus datos siguen aquí: puede reintentar o escribirnos por WhatsApp.': 'Nous n’avons pas pu envoyer votre demande en raison d’un problème de connexion. Vos informations sont toujours là : vous pouvez réessayer ou nous écrire sur WhatsApp.',
    'El servicio no está disponible en este momento. Sus datos siguen aquí: puede reintentar en unos segundos o escribirnos por WhatsApp.': 'Le service n’est pas disponible pour le moment. Vos informations sont toujours là : vous pouvez réessayer dans quelques secondes ou nous écrire sur WhatsApp.',
    'Recibimos varias solicitudes suyas en poco tiempo. Espere unos minutos e inténtelo de nuevo, o escríbanos por WhatsApp.': 'Nous avons reçu plusieurs demandes de votre part en peu de temps. Patientez quelques minutes et réessayez, ou écrivez-nous sur WhatsApp.',
    'Revise los campos marcados:': 'Vérifiez les champs signalés :',
    'Enviando…': 'Envoi en cours…',
    'Indique un teléfono o un correo electrónico.': 'Indiquez un téléphone ou une adresse e-mail.',
    'Marque la casilla de autorización para continuar.': 'Cochez la case d’autorisation pour continuer.',
    'Elija un plan de la lista.': 'Choisissez une formule dans la liste.',
    'Escriba su nombre.': 'Saisissez votre nom.',
    'Revise su nombre.': 'Vérifiez votre nom.',
    'Indique el nombre de su negocio, su Instagram o su sitio web.': 'Indiquez le nom de votre entreprise, son Instagram ou son site web.',
    'Revise el nombre de su negocio.': 'Vérifiez le nom de votre entreprise.',
    'Revise el teléfono: solo números, espacios, paréntesis, guiones y el signo +, entre 7 y 20 caracteres.': 'Vérifiez le téléphone : uniquement des chiffres, des espaces, des parenthèses, des tirets et le signe +, entre 7 et 20 caractères.',
    'Revise el correo electrónico; por ejemplo, nombre@dominio.com.': 'Vérifiez l’adresse e-mail ; par exemple, nom@domaine.com.',
    'Revise la ciudad.': 'Vérifiez la ville.',
    'Revise el mensaje.': 'Vérifiez le message.',
    'El nombre': 'Le nom',
    'El nombre del negocio': 'Le nom de l’entreprise',
    'El teléfono': 'Le téléphone',
    'El correo': 'L’e-mail',
    'La ciudad': 'La ville',
    'El mensaje': 'Le message',

    // Team
    'Equipo fundador': 'Équipe fondatrice',
    'Director ejecutivo (CEO)': 'Directeur général (CEO)',
    'Director financiero (CFO)': 'Directeur financier (CFO)',
    'Director de tecnología (CTO)': 'Directeur de la technologie (CTO)',
    'Trayectoria': 'Parcours',

    // The logos and the stories. The businesses and the quotes are made up, so in French (BF-W1, decision 1) the heading
    // does not say "real clients", each quote reads as an example scenario, and the page shows a note (index.html).
    'Clientes reales creando su sueño con nosotros': 'Exemples illustratifs : des entreprises qui construisent leur rêve',
    'Una pequeña inversión con retorno inmediato en más clientes y mejor gestión.': 'Un petit investissement au retour immédiat : plus de clients et une meilleure gestion.',
    'Pausar logos': 'Mettre les logos en pause',
    'Reanudar logos': 'Reprendre le défilement des logos',
    'Historias de clientes': 'Exemples de scénarios',
    'Fisioterapia': 'Kinésithérapie',
    'Clínica dental': 'Cabinet dentaire',
    'Peluquería y barbería': 'Salon de coiffure et barbier',
    'Estudio de tatuajes': 'Studio de tatouage',
    'Restaurante': 'Restaurant',
    'Fisioterapia · Alba Fisioterapia': 'Kinésithérapie · Alba Fisioterapia',
    'Clínica dental · Sonríe Dental': 'Cabinet dentaire · Sonríe Dental',
    'Peluquería y barbería · Barbería El Bigote': 'Salon de coiffure et barbier · Barbería El Bigote',
    'Estudio de tatuajes · Tinta Norte': 'Studio de tatouage · Tinta Norte',
    'Restaurante · La Fonda de Rosita': 'Restaurant · La Fonda de Rosita',
    '“El tiempo que se me iba organizando citas, respondiendo a pacientes y haciendo reservas ahora lo dedico a mi consulta y a lo que sé hacer.”': 'Exemple : le temps que la directrice passait à organiser les rendez-vous, à répondre aux patients et à prendre les réservations, elle le consacre désormais à ses consultations et à ce qu’elle sait faire.',
    'Directora · Alba Fisioterapia': 'Directrice · Alba Fisioterapia',
    'Alba no tenía sistema de agendamiento: las citas se llevaban por WhatsApp y en un cuaderno.': 'Alba n’avait pas de système de prise de rendez-vous : tout se gérait par WhatsApp et dans un cahier.',
    'Ahora tiene reservas automáticas desde su página web, de día y de noche.': 'Elle dispose désormais de réservations automatiques depuis son site web, de jour comme de nuit.',
    'Analiza su desempeño financiero y por paciente, mes a mes, en un solo panel.': 'Elle analyse ses résultats financiers et le suivi par patient, mois par mois, dans un seul tableau de bord.',
    '“Los pacientes reservan en la noche desde el celular y en la mañana ya tengo el día organizado. Mi equipo dejó de vivir pegado al teléfono.”': 'Exemple : les patients réservent le soir depuis leur téléphone et, le matin, la journée est déjà organisée. L’équipe n’est plus pendue au téléphone.',
    'Odontólogo y director · Sonríe Dental': 'Dentiste et directeur · Sonríe Dental',
    'Sonríe Dental tenía dos sedes y una agenda en Excel para cada una.': 'Sonríe Dental avait deux établissements et un agenda sous Excel pour chacun.',
    'Las dos sedes comparten una sola agenda en línea, con la historia de cada paciente a un clic.': 'Les deux établissements partagent un seul agenda en ligne, avec le dossier de chaque patient à un clic.',
    'Ve en un mismo panel cuánto factura cada sede y cada tratamiento.': 'Un même tableau de bord montre le chiffre d’affaires de chaque établissement et de chaque traitement.',
    '“Los clientes ya no tienen que llamar ni esperar respuesta: escogen barbero y hora, y llegan. Los sábados ya no se me cruzan los turnos.”': 'Exemple : les clients n’ont plus besoin d’appeler ni d’attendre une réponse ; ils choisissent leur barbier et leur horaire, puis ils viennent. Le samedi, les rendez-vous ne se chevauchent plus.',
    'Dueño · Barbería El Bigote': 'Propriétaire · Barbería El Bigote',
    'El Bigote tomaba los turnos por Instagram y cada fin de semana se cruzaban horarios.': 'El Bigote prenait les rendez-vous par Instagram et, chaque week-end, des horaires se chevauchaient.',
    'Cada barbero tiene su agenda y los clientes reservan solos desde la página.': 'Chaque barbier a son agenda et les clients réservent eux-mêmes depuis le site.',
    'Cobra con tarjeta, Nequi o efectivo, y cada venta queda registrada con su barbero.': 'Le salon encaisse par carte, Nequi ou en espèces, et chaque vente est enregistrée avec son barbier.',
    '“En una sesión no puedo soltar la máquina para contestar mensajes. Ahora las citas me llegan con la idea del diseño y la zona, sin que yo tenga que responder.”': 'Exemple : pendant une séance, la tatoueuse ne peut pas lâcher sa machine pour répondre aux messages. Désormais, les rendez-vous arrivent avec l’idée du motif et la zone du corps, sans qu’elle ait à répondre.',
    'Tatuadora y fundadora · Tinta Norte': 'Tatoueuse et fondatrice · Tinta Norte',
    'Tinta Norte coordinaba diseños, fechas y precios por chat, cliente por cliente.': 'Tinta Norte organisait les motifs, les dates et les prix par chat, client par client.',
    'Sus clientes reservan la sesión y envían la referencia del diseño desde la página.': 'Ses clients réservent leur séance et envoient la référence du motif depuis le site.',
    'Su portafolio en la página le trae clientes nuevos que la encuentran en Google.': 'Son portfolio sur le site lui amène de nouveaux clients qui la trouvent sur Google.',
    '“Antes el teléfono no paraba a la hora del almuerzo. Ahora los pedidos llegan organizados, con la dirección y el pago hechos.”': 'Exemple : avant, le téléphone n’arrêtait pas de sonner à l’heure du déjeuner. Désormais, les commandes arrivent organisées, avec l’adresse et le paiement déjà faits.',
    'Dueña · La Fonda de Rosita': 'Propriétaire · La Fonda de Rosita',
    'La Fonda tomaba los domicilios por teléfono y los anotaba a mano.': 'La Fonda prenait les commandes à livrer par téléphone et les notait à la main.',
    'Sus clientes piden desde el menú en línea y pagan al hacer el pedido.': 'Ses clients commandent depuis le menu en ligne et paient au moment de la commande.',
    'Sabe qué platos se venden más y a qué horas, mes a mes.': 'Le restaurant sait quels plats se vendent le mieux et à quelles heures, mois par mois.',
    'Menos tiempo administrativo, más tiempo en su negocio y lo que haces mejor': 'Moins de temps administratif, plus de temps pour votre entreprise et ce que vous faites le mieux',

    // Escoge TU negocio
    'Escoge': 'Choisissez',
    'TU': 'VOTRE',
    'negocio': 'activité',
    '15 tipos de negocio': '15 types d’activité',
    'Escoge TU negocio': 'Choisissez VOTRE activité',
    'Elija su tipo de negocio y vea lo que GTL AI hace por usted.': 'Choisissez votre type d’activité et découvrez ce que GTL AI fait pour vous.',
    'Tipo de negocio': 'Type d’activité',
    '¿Su negocio no está en la lista?': 'Votre activité n’est pas dans la liste ?',
    'Cuéntenos su sueño y armamos la solución a su medida, con lo que su negocio necesita.': 'Parlez-nous de votre rêve et nous construisons la solution sur mesure, avec ce dont votre entreprise a besoin.',
    'Cuéntenos su sueño': 'Parlez-nous de votre rêve',
    'Agenda y pagos': 'Agenda et paiements',
    'Clientes': 'Relation client',
    'Marketing y automatización': 'Marketing et automatisation',
    'Gestión': 'Gestion',
    'Agenda del equipo': 'Agenda de l’équipe',
    'Clases y cupos': 'Cours et places',
    'Reserva de mesas': 'Réservation de tables',
    'Pedidos en línea': 'Commandes en ligne',
    'Pagos y caja': 'Paiements et caisse',
    'Fichas de clientes': 'Fiches clients',
    'Historia clínica': 'Dossier médical',
    'Fichas de mascotas': 'Fiches des animaux',
    'Portal de residentes': 'Portail des résidents',
    'Mensajes y WhatsApp': 'Messages et WhatsApp',
    'Recordatorios por WhatsApp': 'Rappels par WhatsApp',
    'Aviso de prenda lista': 'Avis « vêtement prêt »',
    'Planes y paquetes': 'Abonnements et forfaits',
    'Portafolio de trabajos': 'Portfolio de réalisations',
    'Domicilios': 'Livraisons',
    'Solicitudes PQRS': 'Demandes et réclamations (PQRS)',
    'Perfil de Empresa en Google': 'Fiche d’établissement Google',
    'Contenido para redes': 'Contenu pour les réseaux sociaux',
    'Campañas por WhatsApp': 'Campagnes par WhatsApp',
    'Reseñas de clientes': 'Avis clients',
    'Recepcionista IA': 'Réceptionniste IA',
    'Inventario': 'Inventaire',
    'Seguimiento de pedidos': 'Suivi des commandes',
    'Gestión del equipo': 'Gestion de l’équipe',
    'Informes y métricas': 'Rapports et indicateurs',
    'Veterinaria': 'Vétérinaire',
    'Entrenador personal': 'Coach personnel',
    'Lavandería': 'Blanchisserie',
    'Sastrería': 'Tailleur',
    'Tienda comercial': 'Boutique',
    'Spa y estética': 'Spa et esthétique',
    'Yoga y pilates': 'Yoga et pilates',
    'Finca y alojamiento': 'Maison de campagne et hébergement',
    'Conjunto residencial': 'Copropriété résidentielle',
    'Otro tipo de sueño': 'Un autre type de rêve',

    // Por qué nosotros
    'Nosotros': 'À propos',
    'Por qué nosotros': 'Pourquoi nous',
    'Contador y asesor financiero con más de 10 años de experiencia. Te asesora en tener las cuentas al día y en organizar las finanzas de tu negocio.': 'Comptable et conseiller financier avec plus de 10 ans d’expérience. Il vous conseille pour tenir vos comptes à jour et organiser les finances de votre entreprise.',
    'Información general': 'Informations générales',
    'Ingeniero de Sistemas de la Universidad de los Andes.': 'Ingénieur en systèmes de l’Universidad de los Andes.',
    'Hoy Senior Fullstack Developer en AgileEngine; antes en Kin + Carta, Anthology (Blackboard) y Trilogy.': 'Aujourd’hui Senior Fullstack Developer chez AgileEngine ; auparavant chez Kin + Carta, Anthology (Blackboard) et Trilogy.',
    'Microservicios': 'Microservices',
    'CFA Charterholder. Contador internacional y administrador de empresas de la Universidad de los Andes, con especialización en Estadística de la Universidad Nacional.': 'CFA Charterholder. Comptable international et diplômé en administration des entreprises de l’Universidad de los Andes, avec une spécialisation en statistique de l’Universidad Nacional.',
    'Experiencia en PwC, Forte Group, IPG y Vivo: presupuestos, proyecciones financieras y análisis de inversiones.': 'Expérience chez PwC, Forte Group, IPG et Vivo : budgets, prévisions financières et analyse d’investissements.',
    'Contabilidad NIIF': 'Comptabilité IFRS',
    'Modelos financieros': 'Modélisation financière',
    'Ingeniero de Sistemas y Computación de la Universidad de los Andes; cursa una maestría en Ciencias de la Computación en Georgia Tech.': 'Ingénieur en systèmes et informatique de l’Universidad de los Andes ; il prépare un master en informatique à Georgia Tech.',
    'Hoy Senior Software Engineer en Amadeus; antes en Achievers, Twilio, Blackboard e IBM.': 'Aujourd’hui Senior Software Engineer chez Amadeus ; auparavant chez Achievers, Twilio, Blackboard et IBM.',

    // Falco
    'Recepcionista con IA': 'Réceptionniste IA',
    'Pausar animación': 'Mettre l’animation en pause',
    'Reanudar animación': 'Reprendre l’animation',
    'Un recepcionista con IA para tu negocio que organiza la agenda y hace reservas automáticas': 'Un réceptionniste IA pour votre entreprise, qui organise l’agenda et prend les réservations automatiquement',
    'Atiende a tus clientes y responde sus preguntas sobre citas y cambios. A ti te responde sobre tu desempeño financiero, te da resúmenes de tu calendario y te mantiene al día. Es tu asistente personal para tu negocio.': 'Il répond à vos clients et à leurs questions sur les rendez-vous et les changements. À vous, il répond sur vos résultats financiers, résume votre calendrier et vous tient informé. C’est votre assistant personnel pour votre entreprise.',
    'Atiende a tus clientes': 'Répond à vos clients',
    'Te resume tu día': 'Résume votre journée',
    'Te da la agenda': 'Vous donne l’agenda',
    'Cliente': 'Client',
    'Tú, el dueño': 'Vous, le propriétaire',
    'por WhatsApp': 'sur WhatsApp',
    'chat con Falco': 'chat avec Falco',
    'TÚ': 'VOUS',
    '¡Hola! ¿Tienen cita de fisioterapia el jueves en la tarde?': 'Bonjour ! Avez-vous un créneau de kinésithérapie jeudi après-midi ?',
    'El jueves tengo 3:15 p. m. o 5:30 p. m. con Camila. ¿Cuál te reservo?': 'Jeudi, j’ai 15 h 15 ou 17 h 30 avec Camila. Lequel souhaitez-vous que je réserve ?',
    'A las 3:15, por favor.': 'À 15 h 15, s’il vous plaît.',
    'Listo: jueves 19 a las 3:15 p. m. Te llega la confirmación por WhatsApp.': 'C’est noté : jeudi 19 à 15 h 15. Vous recevrez la confirmation par WhatsApp.',
    'Cita agendada': 'Rendez-vous pris',
    '¿Cómo va mi calendario hoy?': 'Comment se présente mon calendrier aujourd’hui ?',
    'Hoy tienes 18 citas: 15 confirmadas, 2 por confirmar y 1 cancelación. Tu primer espacio libre es a las 2:00 p. m.': 'Aujourd’hui, vous avez 18 rendez-vous : 15 confirmés, 2 à confirmer et 1 annulation. Votre premier créneau libre est à 14 h.',
    '¿Y cómo vamos en ventas?': 'Et où en sont les ventes ?',
    'Llevas $ 2.340.000 hoy, 8 % más que el martes pasado.': 'Vous en êtes à $ 2.340.000 aujourd’hui, 8 % de plus que mardi dernier.',
    'Dame la agenda de hoy.': 'Donnez-moi l’agenda d’aujourd’hui.',
    'Esta es tu agenda de hoy:': 'Voici votre agenda d’aujourd’hui :',
    'Sofía Arango · Fisioterapia': 'Sofía Arango · Kinésithérapie',
    'Mateo Cárdenas · Valoración': 'Mateo Cárdenas · Bilan',
    'María José Pérez · Fisioterapia': 'María José Pérez · Kinésithérapie',
    'Daniel Ospina · Rehabilitación': 'Daniel Ospina · Rééducation',
    'y 14 citas más': 'et 14 autres rendez-vous',
    'Pruébalo tú mismo': 'Essayez vous-même',
    'Elige una pregunta y mira cómo responde Falco.': 'Choisissez une question et voyez comment Falco répond.',
    'Demostración: respuestas de ejemplo con los datos de Alba, una clínica ficticia. Todavía no es la IA en vivo.': 'Démonstration : réponses d’exemple avec les données d’Alba, une clinique fictive. Ce n’est pas encore l’IA en direct.',
    'Conversación de ejemplo con Falco': 'Conversation d’exemple avec Falco',
    '¡Hola! Soy Falco. Elige una pregunta y te respondo con los datos de ejemplo de Alba.': 'Bonjour ! Je suis Falco. Choisissez une question et je vous réponds avec les données d’exemple d’Alba.',
    'Pregúntale a Falco:': 'Demandez à Falco :',
    'Día lleno: 21 citas y solo queda un espacio, a las 4:30 p. m. con Andrés. ¿Lo ofrezco a la lista de espera?': 'Journée complète : 21 rendez-vous et il ne reste qu’un créneau, à 16 h 30 avec Andrés. Dois-je le proposer à la liste d’attente ?',
    'Vas bien: 16 citas, todas confirmadas. Camila tiene la mañana completa y Valentina está libre desde las 3:00 p. m.': 'Tout va bien : 16 rendez-vous, tous confirmés. Camila a la matinée complète et Valentina est libre à partir de 15 h.',
    'Hoy hay 14 citas. Dos pacientes pidieron cambiar de hora y ya los reubiqué; no tienes cruces.': 'Il y a 14 rendez-vous aujourd’hui. Deux patients ont demandé à changer d’horaire et je les ai déjà replacés ; il n’y a aucun chevauchement.',
    'Tienes 19 citas y 3 valoraciones de pacientes nuevos. La primera es a las 8:00 a. m. con Sofía Arango.': 'Vous avez 19 rendez-vous et 3 bilans de nouveaux patients. Le premier est à 8 h avec Sofía Arango.',
    'Dame la agenda de mañana.': 'Donnez-moi l’agenda de demain.',
    'Mañana empiezas a las 8:00 a. m. con Mateo Cárdenas y terminas a las 6:00 p. m. Son 15 citas y el almuerzo está bloqueado de 12:00 a 1:00.': 'Demain, vous commencez à 8 h avec Mateo Cárdenas et vous terminez à 18 h. Cela fait 15 rendez-vous et le déjeuner est bloqué de 12 h à 13 h.',
    'Mañana tienes 12 citas. La tarde está suave: hay tres espacios libres después de las 3:00 p. m.': 'Demain, vous avez 12 rendez-vous. L’après-midi est calme : il y a trois créneaux libres après 15 h.',
    'Mañana: 17 citas, 2 clases de pilates llenas y una valoración nueva a las 10:30 a. m.': 'Demain : 17 rendez-vous, 2 cours de pilates complets et un nouveau bilan à 10 h 30.',
    'Mañana es tu día más ocupado de la semana: 20 citas. Ya confirmé 18 de ellas.': 'Demain est votre journée la plus chargée de la semaine : 20 rendez-vous. J’en ai déjà confirmé 18.',
    'Mañana tienes 13 citas. Daniel Ospina pidió pasar su cita de las 11:00 a las 4:00 p. m. ¿La muevo?': 'Demain, vous avez 13 rendez-vous. Daniel Ospina a demandé à déplacer le sien de 11 h à 16 h. Dois-je le déplacer ?',
    '¿Cuánto vendí esta semana?': 'Combien ai-je vendu cette semaine ?',
    'Esta semana llevas $ 11.850.000, un 9 % más que la semana pasada. El mejor día fue el martes.': 'Cette semaine, vous en êtes à $ 11.850.000, soit 9 % de plus que la semaine dernière. Le meilleur jour a été mardi.',
    'Vas en $ 9.420.000 esta semana. Fisioterapia aporta el 58 % de las ventas.': 'Vous en êtes à $ 9.420.000 cette semaine. La kinésithérapie représente 58 % des ventes.',
    'Llevas $ 12.300.000 en 96 ventas. Tu ticket promedio subió a $ 128.000.': 'Vous en êtes à $ 12.300.000 pour 96 ventes. Votre panier moyen est monté à $ 128.000.',
    'Esta semana: $ 10.760.000. Te faltan $ 1.240.000 para igualar tu mejor semana del mes.': 'Cette semaine : $ 10.760.000. Il vous manque $ 1.240.000 pour égaler votre meilleure semaine du mois.',
    '$ 8.990.000 hasta hoy, con 71 ventas. El 64 % se pagó con tarjeta o Nequi.': '$ 8.990.000 à ce jour, pour 71 ventes. 64 % ont été payés par carte ou Nequi.',
    '¿Quién no ha pagado?': 'Qui n’a pas encore payé ?',
    'Tienes 2 ventas pendientes por $ 1.135.000: Laura Henao (paquete de 10 sesiones) y Carolina Zapata (abono del 50 %).': 'Vous avez 2 ventes en attente pour $ 1.135.000 : Laura Henao (forfait de 10 séances) et Carolina Zapata (acompte de 50 %).',
    'Solo una: Laura Henao debe $ 1.080.000 de su paquete. Le envié el link de pago ayer. ¿Se lo recuerdo?': 'Une seule : Laura Henao doit $ 1.080.000 pour son forfait. Je lui ai envoyé le lien de paiement hier. Dois-je le lui rappeler ?',
    'Hay 3 saldos pendientes que suman $ 640.000. El más antiguo es de hace 9 días.': 'Il y a 3 soldes en attente pour un total de $ 640.000. Le plus ancien date d’il y a 9 jours.',
    'Hoy estás al día: no hay pagos pendientes. La última cuenta por cobrar se pagó esta mañana.': 'Aujourd’hui, vous êtes à jour : il n’y a aucun paiement en attente. La dernière créance a été réglée ce matin.',
    'Faltan 4 pagos por $ 912.000. Dos son de pacientes con cita mañana; puedo cobrarles al llegar.': 'Il manque 4 paiements pour $ 912.000. Deux concernent des patients qui ont rendez-vous demain ; je peux les encaisser à leur arrivée.',
    '¿Cuándo debo pagar impuestos?': 'Quand dois-je payer mes impôts ?',
    'Con el NIT de ejemplo de Alba, tu declaración de renta vence el 12 de mayo. Te aviso una semana antes.': 'Avec le NIT d’exemple d’Alba, votre déclaration de revenus arrive à échéance le 12 mai. Je vous préviens une semaine avant.',
    'Lo más cercano es el IVA del bimestre: vence el 14 de enero según el NIT de ejemplo de Alba.': 'L’échéance la plus proche est la TVA colombienne (IVA) du bimestre : elle tombe le 14 janvier selon le NIT d’exemple d’Alba.',
    'Este mes solo tienes la retención en la fuente, el día 16. La declaración de renta vence en mayo (fechas de ejemplo de Alba).': 'Ce mois-ci, vous n’avez que la retenue à la source, le 16. La déclaration de revenus arrive à échéance en mai (dates d’exemple d’Alba).',
    'Tu próximo vencimiento es el ICA de Bogotá, el 23 de enero. Ya tengo listo el resumen para tu contador (fechas de ejemplo).': 'Votre prochaine échéance est l’ICA de Bogotá, le 23 janvier. J’ai déjà préparé le récapitulatif pour votre comptable (dates d’exemple).',
    'Tienes tres fechas este trimestre: retención el 16, IVA el 14 de enero y renta en mayo. Son fechas de ejemplo para el NIT de Alba.': 'Vous avez trois dates ce trimestre : retenue le 16, TVA colombienne (IVA) le 14 janvier et impôt sur le revenu en mai. Ce sont des dates d’exemple pour le NIT d’Alba.',
    '¿Cuál es mi servicio más vendido?': 'Quel est mon service le plus vendu ?',
    'Fisioterapia: 142 sesiones este mes, el 58 % de tus ingresos. Le sigue el masaje terapéutico.': 'La kinésithérapie : 142 séances ce mois-ci, soit 58 % de vos revenus. Vient ensuite le massage thérapeutique.',
    'Este mes gana Fisioterapia con $ 17.040.000. Pilates clínico es el que más creció: 22 %.': 'Ce mois-ci, la kinésithérapie l’emporte avec $ 17.040.000. Le pilates clinique est celui qui a le plus progressé : 22 %.',
    'Tu servicio estrella es Fisioterapia. El paquete de 10 sesiones se vendió 9 veces este mes.': 'Votre service phare est la kinésithérapie. Le forfait de 10 séances s’est vendu 9 fois ce mois-ci.',
    'Fisioterapia va primero y Rehabilitación deportiva segundo. Juntos son 3 de cada 4 pesos que entran.': 'La kinésithérapie est en tête et la rééducation sportive en deuxième position. Ensemble, elles représentent 3 pesos sur 4 encaissés.',
    'Fisioterapia, con 38 sesiones esta semana. El masaje terapéutico se vende más los viernes.': 'La kinésithérapie, avec 38 séances cette semaine. Le massage thérapeutique se vend mieux le vendredi.',
    '¿Tengo espacios libres el viernes?': 'Ai-je des créneaux libres vendredi ?',
    'Sí, 5 espacios: 8:15 y 10:45 a. m. con Camila, y 2:00, 4:30 y 5:15 p. m. con Andrés.': 'Oui, 5 créneaux : 8 h 15 et 10 h 45 avec Camila, et 14 h, 16 h 30 et 17 h 15 avec Andrés.',
    'El viernes quedan 3 espacios, todos en la tarde. ¿Los publico en tu página de reservas?': 'Vendredi, il reste 3 créneaux, tous l’après-midi. Dois-je les publier sur votre page de réservation ?',
    'Solo uno: a las 11:30 a. m. con Valentina. El resto del viernes está lleno.': 'Un seul : à 11 h 30 avec Valentina. Le reste du vendredi est complet.',
    'Tienes 7 espacios libres el viernes. La mañana está casi vacía; puede ser buen día para una promoción.': 'Vous avez 7 créneaux libres vendredi. La matinée est presque vide ; ce pourrait être un bon jour pour une promotion.',
    'Sí: 4 espacios entre las 2:00 y las 5:00 p. m. Las clases de pilates del viernes ya están llenas.': 'Oui : 4 créneaux entre 14 h et 17 h. Les cours de pilates du vendredi sont déjà complets.',
    '¿Cuántos clientes nuevos tuve este mes?': 'Combien de nouveaux clients ai-je eus ce mois-ci ?',
    'Este mes llegaron 34 pacientes nuevos, 8 más que el mes pasado. 21 reservaron desde tu página web.': 'Ce mois-ci, 34 nouveaux patients sont arrivés, 8 de plus que le mois dernier. 21 ont réservé depuis votre site web.',
    'Llevas 27 pacientes nuevos. La mayoría te encontró en Google buscando «fisioterapia en chicó».': 'Vous comptez 27 nouveaux patients. La plupart vous ont trouvé sur Google en cherchant « fisioterapia en chicó ».',
    '41 pacientes nuevos este mes, tu mejor cifra del año. 6 de cada 10 ya agendaron su segunda cita.': '41 nouveaux patients ce mois-ci, votre meilleur chiffre de l’année. 6 sur 10 ont déjà pris leur deuxième rendez-vous.',
    'Este mes: 29 nuevos. 12 llegaron recomendados por otros pacientes.': 'Ce mois-ci : 29 nouveaux. 12 sont venus sur recommandation d’autres patients.',
    'Tienes 31 pacientes nuevos y 19 ya compraron un paquete de sesiones.': 'Vous avez 31 nouveaux patients et 19 ont déjà acheté un forfait de séances.',
    'Historias': 'Exemples',
    'Falco · Recepcionista IA': 'Falco · Réceptionniste IA',
    'Falco IA': 'Falco IA',

    // The logo's story
    'Animación: el carácter 夢, que significa sueño, cambia desde la escritura antigua hasta convertirse en el logo de GTL AI': 'Animation : le caractère 夢, qui signifie rêve, évolue de l’écriture ancienne jusqu’à devenir le logo de GTL AI',
    'Reproducir animación': 'Lire l’animation',
    'Nuestro logo': 'Notre logo',
    'significa «sueño»': 'signifie « rêve »',
    'Este carácter chino significa «sueño» y se escribe así desde hace más de 3.000 años. Los avances de la humanidad siempre fueron un sueño primero, y nosotros lo elegimos porque de eso se trata GTL AI: de impulsar tus sueños para hacerlos realidad.': 'Ce caractère chinois signifie « rêve » et s’écrit ainsi depuis plus de 3 000 ans. Les avancées de l’humanité ont toujours été d’abord un rêve, et nous l’avons choisi parce que c’est la raison d’être de GTL AI : propulser vos rêves pour en faire une réalité.',
    'Nosotros nos encargamos de la parte técnica, financiera y operativa, mientras usted se enfoca en su negocio y en lo que mejor hace.': 'Nous nous chargeons de la partie technique, financière et opérationnelle, pendant que vous vous concentrez sur votre entreprise et sur ce que vous faites le mieux.',

    // The pricing page
    'Tu negocio en internet.': 'Votre entreprise sur internet.',
    'Elegir Presencia': 'Choisir Présence',
    'Tu agenda llena, sin llamadas.': 'Votre agenda rempli, sans appels.',
    'Todo lo de Presencia, y además:': 'Tout ce qu’offre Présence, et en plus :',
    'Elegir Agenda': 'Choisir Agenda',
    'El control de tu negocio.': 'La maîtrise de votre entreprise.',
    'Todo lo de Agenda, y además:': 'Tout ce qu’offre Agenda, et en plus :',
    'Elegir Gestión': 'Choisir Gestion',
    'Completo': 'Complet',
    'Todo, con tu asistente de IA.': 'Tout, avec votre assistant IA.',
    'Todo lo de Gestión, y además:': 'Tout ce qu’offre Gestion, et en plus :',
    'Elegir Completo': 'Choisir Complet',
    'Desde Presencia': 'À partir de Présence',
    'Desde Agenda': 'À partir d’Agenda',
    'Desde Gestión': 'À partir de Gestion',
    '¿Hay costo de instalación?': 'Y a-t-il des frais d’installation ?',
    'No. Solo pagas la mensualidad de tu plan; la puesta en marcha va por nuestra cuenta.': 'Non. Vous ne payez que la mensualité de votre formule ; la mise en service est à notre charge.',
    '¿Hay permanencia mínima?': 'Y a-t-il un engagement minimum ?',
    'Sí, de 12 meses. Así podemos construir y configurar todo sin cobrarte al inicio.': 'Oui, de 12 mois. C’est ce qui nous permet de tout construire et configurer sans rien vous facturer au départ.',
    'Sí. Puedes subir de plan cuando quieras y el cambio se refleja en tu siguiente mensualidad.': 'Oui. Vous pouvez passer à une formule supérieure quand vous le souhaitez et le changement apparaît sur votre mensualité suivante.',
    '¿Qué pasa con mis datos si cancelo?': 'Que deviennent mes données si je résilie ?',
    'Son tuyos. Te entregamos una copia y tu dominio sigue a tu nombre.': 'Elles vous appartiennent. Nous vous en remettons une copie et votre domaine reste à votre nom.',
    '¿Necesito saber de tecnología?': 'Dois-je m’y connaître en technologie ?',
    'No. Nosotros lo montamos todo y te enseñamos a usarlo.': 'Non. Nous installons tout et nous vous apprenons à l’utiliser.',
    'Puesta en marcha gratis': 'Mise en service gratuite',
    'Nosotros armamos tu página, configuramos tu sistema, pasamos tus datos y capacitamos a tu equipo. Sin costo.': 'Nous créons votre page, configurons votre système, transférons vos données et formons votre équipe. Sans frais.',
    'Soporte de primer nivel': 'Une assistance de premier ordre',
    'Hablas directamente con el equipo que construyó tu sistema. Te respondemos el mismo día hábil.': 'Vous parlez directement à l’équipe qui a construit votre système. Nous vous répondons le jour ouvrable même.',
    'Si te vas, te llevas tus datos': 'Si vous partez, vous emportez vos données',
    'Tu dominio y tus datos son tuyos. Si decides irte, te entregamos una copia completa.': 'Votre domaine et vos données vous appartiennent. Si vous décidez de partir, nous vous en remettons une copie complète.',
    'Planes mensuales sin costo de instalación: página web, agenda, ventas, finanzas y Falco, tu recepcionista con IA. Precios en pesos colombianos.': 'Formules mensuelles sans frais d’installation : site web, agenda, ventes, finances et Falco, votre réceptionniste IA. Prix en pesos colombiens.',
    'Precios | GTL AI': 'Tarifs | GTL AI',
    'Precios': 'Tarifs',
    'Precios sencillos para empresas que crecen': 'Des tarifs simples pour les entreprises qui grandissent',
    'Un pago mensual, sin costo de instalación. Empieza con lo que necesitas hoy y sube de plan cuando tu negocio crezca.': 'Un paiement mensuel, sans frais d’installation. Commencez avec ce dont vous avez besoin aujourd’hui et passez à une formule supérieure quand votre entreprise grandit.',
    'Landing page con el estilo de tu negocio': 'Une landing page dans le style de votre entreprise',
    'SEO local para que te encuentren en Google': 'SEO local pour que l’on vous trouve sur Google',
    'Dominio, hosting y seguridad incluidos': 'Domaine, hébergement et sécurité inclus',
    'Botón de WhatsApp y formulario de contacto': 'Bouton WhatsApp et formulaire de contact',
    'Agenda de todo tu equipo': 'L’agenda de toute votre équipe',
    'Reservas en línea, de día y de noche': 'Réservations en ligne, de jour comme de nuit',
    'Fichas de clientes con su historial': 'Fiches clients avec leur historique',
    'Ventas y pagos en un solo lugar': 'Ventes et paiements au même endroit',
    'Falco, tu recepcionista con IA': 'Falco, votre réceptionniste IA',
    'Atiende y agenda a tus clientes por chat': 'Répond à vos clients et prend leurs rendez-vous par chat',
    'Resúmenes de tu agenda y tus finanzas': 'Résumés de votre agenda et de vos finances',
    '¿Solo necesitas algunas funciones? Elige las tuyas y armamos tu plan.': 'Vous n’avez besoin que de certaines fonctionnalités ? Choisissez les vôtres et nous composons votre formule.',
    'Cotizar mi plan': 'Demander un devis pour ma formule',
    'Todos los planes incluyen hosting, dominio, actualizaciones de seguridad, copias de seguridad y soporte.': 'Toutes les formules incluent l’hébergement, le domaine, les mises à jour de sécurité, les sauvegardes et l’assistance.',
    'Todo lo que obtienes con GTL AI': 'Tout ce que vous obtenez avec GTL AI',
    'Landing page a tu medida': 'Une landing page sur mesure',
    'SEO local': 'SEO local',
    'Dominio y hosting': 'Domaine et hébergement',
    'Ingresos, gastos y utilidad': 'Revenus, dépenses et bénéfice',
    'Exportación para tu contador': 'Export pour votre comptable',
    'Cuentas por cobrar': 'Créances clients',
    'Ventas por servicio y por profesional': 'Ventes par service et par professionnel',
    'Complementos opcionales': 'Compléments en option',
    'Agrégalos a tu plan cuando los necesites.': 'Ajoutez-les à votre formule quand vous en avez besoin.',
    'Asesorías financieras y tributarias': 'Conseil financier et fiscal',
    'Con un contador público: revisa tus cuentas contigo, te ayuda a planear tus impuestos y a poner tus finanzas en orden.': 'Avec un expert-comptable : il examine vos comptes avec vous, vous aide à planifier vos impôts et à mettre vos finances en ordre.',
    'Falco, chatbot con IA': 'Falco, chatbot IA',
    'Tu recepcionista con IA: atiende a tus clientes, agenda citas y te resume tu día. Ya viene incluido en el plan Completo.': 'Votre réceptionniste IA : il répond à vos clients, prend les rendez-vous et résume votre journée. Il est déjà inclus dans la formule Complet.',
    'Con cada plan': 'Avec chaque formule',
    '¿GTL AI es para ti?': 'GTL AI est-il fait pour vous ?',
    'Cuéntanos de tu negocio y te mostramos en vivo cómo funcionaría, sin compromiso.': 'Parlez-nous de votre entreprise et nous vous montrons en direct comment cela fonctionnerait, sans engagement.',
    'Agendar una demostración': 'Planifier une démonstration',
    ', sin costo de instalación.': ', sans frais d’installation.',
    'Ver precios': 'Voir les tarifs',
    'Una página rápida, con el estilo de tu negocio, que se ve bien en cualquier celular.': 'Une page rapide, dans le style de votre entreprise, qui s’affiche bien sur tous les téléphones.',
    'Preparamos tu página para que la gente cercana te encuentre cuando busca tu servicio en Google.': 'Nous préparons votre page pour que les personnes à proximité vous trouvent lorsqu’elles cherchent votre service sur Google.',
    'Mantenemos tu ficha de Google al día: horarios, fotos, ubicación y reseñas.': 'Nous tenons votre fiche Google à jour : horaires, photos, adresse et avis.',
    'Tu propio dominio, hosting, seguridad y copias de seguridad incluidos, sin que tengas que configurar nada.': 'Votre propre domaine, l’hébergement, la sécurité et les sauvegardes inclus, sans que vous ayez rien à configurer.',
    'Tus clientes te escriben con un toque desde tu página.': 'Vos clients vous écrivent d’un seul geste depuis votre page.',
    'La agenda de todos tus profesionales, por día o por semana, con colores por servicio.': 'L’agenda de tous vos professionnels, par jour ou par semaine, avec une couleur par service.',
    'Tus clientes eligen servicio, profesional y hora, y la cita aparece sola en tu agenda.': 'Vos clients choisissent le service, le professionnel et l’horaire, et le rendez-vous apparaît tout seul dans votre agenda.',
    'Clases grupales con cupos limitados y lista de espera.': 'Cours collectifs avec places limitées et liste d’attente.',
    'Cobra con tarjeta, transferencia o efectivo y lleva la caja del día.': 'Encaissez par carte, virement ou espèces et tenez la caisse du jour.',
    'Recibe pedidos desde tu menú o catálogo en línea.': 'Recevez des commandes depuis votre menu ou votre catalogue en ligne.',
    'Ve cuánto entra, cuánto sale y cuánto te queda, mes a mes.': 'Voyez combien il entre, combien il sort et combien il vous reste, mois par mois.',
    'Informes de ventas, ocupación y clientes para decidir con datos.': 'Rapports de ventes, d’occupation et de clients pour décider à partir des données.',
    'Exporta tus movimientos en un archivo listo para tu contador.': 'Exportez vos mouvements dans un fichier prêt pour votre comptable.',
    'Sabe quién te debe, cuánto y desde cuándo.': 'Sachez qui vous doit de l’argent, combien et depuis quand.',
    'Emite facturas electrónicas válidas ante la DIAN desde la misma venta.': 'Émettez des factures électroniques valables auprès de la DIAN (l’administration fiscale colombienne) directement depuis la vente.',
    'El historial de citas, pagos y notas de cada cliente en un solo lugar.': 'L’historique des rendez-vous, des paiements et des notes de chaque client au même endroit.',
    'Todas las conversaciones con tus clientes en una sola bandeja.': 'Toutes les conversations avec vos clients dans une seule boîte de réception.',
    'Vende paquetes de sesiones y membresías, y controla lo que queda por usar.': 'Vendez des forfaits de séances et des abonnements, et suivez ce qu’il reste à utiliser.',
    'Pide una reseña después de cada cita y muéstralas en tu página.': 'Demandez un avis après chaque rendez-vous et affichez-les sur votre page.',
    'Recordatorios automáticos antes de cada cita, para que falten menos.': 'Rappels automatiques avant chaque rendez-vous, pour réduire les absences.',
    'Controla tus productos e insumos, con avisos cuando algo se está acabando.': 'Suivez vos produits et vos fournitures, avec des alertes quand un article vient à manquer.',
    'Los horarios, los servicios y el desempeño de cada profesional.': 'Les horaires, les services et les résultats de chaque professionnel.',
    'Maneja todas tus sedes desde una sola cuenta.': 'Gérez tous vos établissements depuis un seul compte.',
    'Sigue cada pedido desde que entra hasta que se entrega.': 'Suivez chaque commande de son arrivée à sa livraison.',
    'Descubre qué servicios y qué profesionales venden más.': 'Découvrez quels services et quels professionnels vendent le plus.',
    'Abre una categoría y pasa por cada función para ver cómo se ve.': 'Ouvrez une catégorie et passez sur chaque fonctionnalité pour voir à quoi elle ressemble.',

    // Quiero saber más
    'Quiero saber más': 'Je veux en savoir plus',
    'Te responde un asesor el mismo día hábil.': 'Un conseiller vous répond le jour ouvrable même.',
    'Agendas una demostración en vivo para ver cómo funcionaría en tu negocio.': 'Vous planifiez une démonstration en direct pour voir comment cela fonctionnerait dans votre entreprise.',
    'Déjenos sus datos': 'Laissez-nous vos coordonnées',
    'Cuéntenos sobre su negocio en un formulario corto y le escribimos.': 'Parlez-nous de votre entreprise dans un court formulaire et nous vous écrirons.',
    'Escríbanos al': 'Écrivez-nous au',
    'y conversemos por chat.': 'et discutons par chat.',
    'Abrir WhatsApp': 'Ouvrir WhatsApp',
    'Escríbanos a': 'Écrivez-nous à',
    'desde su correo.': 'depuis votre messagerie.',

    // BF-W1: the footer, the team and Expertise-as-Software (the name stays in English)
    'Instagram de GTL AI': 'Instagram de GTL AI',
    'Director de operaciones (COO)': 'Directeur des opérations (COO)',
    'Investigador y desarrollador de productos de IA': 'Chercheur et développeur de produits d’IA',
    'PhD en arquitectura de diseño conversacional con IA': 'PhD en architecture de design conversationnel par IA',
    'Emprendedor en serie': 'Entrepreneur en série',
    'Exjugador de squash del PSA Challenger Tour': 'Ancien joueur de squash du PSA Challenger Tour',
    'Lidera nuestra sede en París y las operaciones de GTL AI. Ingeniero de software con más de 10 años de experiencia.': 'Il dirige notre bureau de Paris et les opérations de GTL AI. Ingénieur logiciel avec plus de 10 ans d’expérience.',
    'Lidera la tecnología de GTL AI. Ingeniero de software con más de 10 años de experiencia.': 'Il dirige la technologie de GTL AI. Ingénieur logiciel avec plus de 10 ans d’expérience.',
    'Expertise-as-Software: la evolución del SaaS': 'Expertise-as-Software : l’évolution du SaaS',
    'El SaaS le vende una herramienta que usted tiene que aprender a usar. Con Expertise-as-Software, su conocimiento se convierte en el software. En GTL AI tomamos lo que usted sabe hacer y la forma en que atiende —sus servicios, sus horarios y sus reglas de reserva— y, con inteligencia artificial, lo convertimos en su propio software.': 'Le SaaS vous vend un outil que vous devez apprendre à utiliser. Avec Expertise-as-Software, votre savoir devient le logiciel. Chez GTL AI, nous prenons ce que vous savez faire et votre façon de recevoir vos clients — vos services, vos horaires et vos règles de réservation — et, grâce à l’intelligence artificielle, nous en faisons votre propre logiciel.',
    'Nuestros paquetes de software incluyen los servicios de un equipo multidisciplinario de expertos en tecnología, inteligencia artificial, diseño web y marketing digital: Presencia, su página web con posicionamiento en Google; Agenda, sus citas y reservas en línea, las 24 horas; Gestión, sus ventas, finanzas e informes en un solo lugar; y Completo, todo lo anterior con Falco, nuestro recepcionista con inteligencia artificial. Como complemento, ofrecemos asesoría financiera y tributaria con contador público.': 'Nos formules logicielles comprennent les services d’une équipe pluridisciplinaire d’experts en technologie, en intelligence artificielle, en conception web et en marketing digital : Présence, votre site web avec référencement sur Google ; Agenda, vos rendez-vous et réservations en ligne, 24 heures sur 24 ; Gestion, vos ventes, vos finances et vos rapports en un seul endroit ; et Complet, tout cela avec Falco, notre réceptionniste doté d’intelligence artificielle. En complément, nous proposons un conseil financier et fiscal avec un expert-comptable.',
    'Es una forma innovadora de hacer negocios en la era de la IA, y somos pioneros en llevarla a Colombia y a toda Latinoamérica. Somos una empresa multinacional, con sede en Bogotá y en París, y existimos para una sola cosa: ayudarle a hacer realidad su sueño.': 'C’est une façon innovante de faire des affaires à l’ère de l’IA, et nous sommes pionniers dans son introduction en Colombie et dans toute l’Amérique latine. Nous sommes une entreprise multinationale, implantée à Bogotá et à Paris, et nous existons pour une seule chose : vous aider à réaliser votre rêve.',

    // BF-W1: prices with VAT included, and the note each pricing button leaves in the form
    '/ mes, IVA incluido': '/ mois, TVA colombienne (IVA) incluse',
    'Me interesa el plan Presencia.': 'La formule Présence m’intéresse.',
    'Me interesa el plan Agenda.': 'La formule Agenda m’intéresse.',
    'Me interesa el plan Gestión.': 'La formule Gestion m’intéresse.',
    'Me interesa el plan Completo.': 'La formule Complet m’intéresse.',
    'Quiero cotizar un plan a medida.': 'Je souhaite un devis pour une formule sur mesure.',
    'Quiero agendar una demostración.': 'Je souhaite planifier une démonstration.',

    // BF-W1: the launch banner and the demos (shown while launch.enabled is true in _dev/site-config.json)
    'Lanzamiento': 'Lancement',
    'Cerrar aviso': 'Fermer cet avis',
    'Lanzamiento oficial este Black Friday, viernes 27 de noviembre.': 'Lancement officiel ce Black Friday, vendredi 27 novembre.',
    'Vea las demos por especialidad.': 'Découvrez les démos par spécialité.',
    'Ya estamos en vivo: sitios web con agenda en línea para cada especialidad.': 'Nous sommes en ligne : des sites web avec agenda en ligne pour chaque spécialité.',
    'Vea las demos.': 'Découvrez les démos.',
    'Demos por especialidad': 'Démos par spécialité',
    'Sitios de muestra con agenda en línea, uno por especialidad. Los datos son de ejemplo.': 'Sites d’exemple avec agenda en ligne, un par spécialité. Les données sont des exemples. Les démos sont en espagnol.',
    'Ver demo': 'Voir la démo',
    'Fisioterapia deportiva': 'Kinésithérapie du sport',
    'Odontología': 'Soins dentaires',
    'Estética': 'Esthétique',
    'Nutrición': 'Nutrition',
    'Psicología': 'Psychologie',
    'Para centros de fisioterapia y rehabilitación deportiva.': 'Pour les centres de kinésithérapie et de rééducation du sport.',
    'Para consultorios de fisioterapia.': 'Pour les cabinets de kinésithérapie.',
    'Para consultorios y clínicas odontológicas.': 'Pour les cabinets et cliniques dentaires.',
    'Para centros de estética.': 'Pour les centres d’esthétique.',
    'Para consultorios de nutrición.': 'Pour les cabinets de nutrition.',
    'Para consultorios de psicología.': 'Pour les cabinets de psychologie.',
    'Para clínicas y consultorios veterinarios.': 'Pour les cliniques et cabinets vétérinaires.',

    // BF-W1: the privacy policy. A translation; the page says the Spanish version is the one that applies.
    'Política de tratamiento de datos personales': 'Politique de traitement des données personnelles',
    '1. Responsable': '1. Responsable du traitement',
    'Correo:': 'E-mail :',
    '. Teléfono y WhatsApp:': '. Téléphone et WhatsApp :',
    '2. Qué datos recibimos': '2. Quelles données nous recevons',
    'Cuando usted nos escribe por WhatsApp desde este sitio, recibimos su número, su nombre de perfil y lo que nos cuente en la conversación.': 'Lorsque vous nous écrivez par WhatsApp depuis ce site, nous recevons votre numéro, votre nom de profil et ce que vous nous dites dans la conversation.',
    'Cuando usa el formulario de solicitud, recibimos su nombre, el nombre de su negocio, su teléfono o correo, su ciudad, su mensaje y el plan que le interesa.': 'Lorsque vous utilisez le formulaire de demande, nous recevons votre nom, le nom de votre entreprise, votre téléphone ou votre e-mail, votre ville, votre message et la formule qui vous intéresse.',
    'No pedimos datos sensibles; por favor no los incluya.': 'Nous ne demandons pas de données sensibles ; merci de ne pas en inclure.',
    '3. Para qué los usamos': '3. À quoi elles nous servent',
    'Para responder su solicitud, enviarle información y propuestas de nuestros planes, y hacer seguimiento comercial. No vendemos sus datos ni los usamos para otros fines sin pedirle autorización.': 'À répondre à votre demande, à vous envoyer des informations et des propositions sur nos formules, et à assurer un suivi commercial. Nous ne vendons pas vos données et ne les utilisons pas à d’autres fins sans vous demander votre autorisation.',
    '4. Autorización': '4. Autorisation',
    'Tratamos sus datos con su autorización, que usted nos da al escribirnos por WhatsApp desde este sitio': 'Nous traitons vos données avec votre autorisation, que vous nous donnez en nous écrivant par WhatsApp depuis ce site',
    'o al marcar la casilla de autorización del formulario': 'ou en cochant la case d’autorisation du formulaire',
    '5. Quién más los maneja': '5. Qui d’autre les traite',
    'Usamos proveedores que tratan datos por cuenta nuestra: WhatsApp (Meta) para las conversaciones, GitHub Pages para alojar este sitio (puede registrar datos técnicos, como su dirección IP) y nuestro proveedor de correo electrónico para recibir y responder sus solicitudes.': 'Nous faisons appel à des prestataires qui traitent des données pour notre compte : WhatsApp (Meta) pour les conversations, GitHub Pages pour héberger ce site (il peut enregistrer des données techniques, comme votre adresse IP) et notre fournisseur de messagerie électronique pour recevoir vos demandes et y répondre.',
    'Para el formulario de solicitud usamos además Railway, que aloja el servidor y la base de datos donde se guardan sus solicitudes, y Resend, que nos envía los correos de aviso de cada solicitud.': 'Pour le formulaire de demande, nous utilisons en outre Railway, qui héberge le serveur et la base de données où sont conservées vos demandes, et Resend, qui nous envoie les e-mails d’avis de chaque demande.',
    'Algunos de estos proveedores están fuera de Colombia, por lo que sus datos pueden almacenarse en otros países, con las medidas de seguridad de esos proveedores.': 'Certains de ces prestataires se trouvent hors de Colombie ; vos données peuvent donc être stockées dans d’autres pays, avec les mesures de sécurité de ces prestataires.',
    '6. Sus derechos': '6. Vos droits',
    'Según la Ley 1581 de 2012, usted puede:': 'Selon la loi 1581 de 2012, vous pouvez :',
    'conocer, actualizar y corregir sus datos;': 'connaître, mettre à jour et rectifier vos données ;',
    'acceder a ellos en forma gratuita;': 'y accéder gratuitement ;',
    'pedir prueba de su autorización;': 'demander la preuve de votre autorisation ;',
    'saber cómo los hemos usado;': 'savoir comment nous les avons utilisées ;',
    'revocar la autorización o pedir que los borremos, cuando no haya un deber legal o contractual de conservarlos;': 'révoquer l’autorisation ou demander que nous les supprimions, lorsqu’il n’existe aucune obligation légale ou contractuelle de les conserver ;',
    'presentar quejas ante la Superintendencia de Industria y Comercio (SIC).': 'déposer des plaintes auprès de la Superintendencia de Industria y Comercio (SIC).',
    '7. Cómo ejercerlos': '7. Comment les exercer',
    'con su nombre, cómo contactarle y su solicitud.': 'avec votre nom, le moyen de vous joindre et votre demande.',
    'Respondemos las consultas en un máximo de 10 días hábiles; si necesitamos más tiempo, le informamos antes el motivo y la nueva fecha, que no superará 5 días hábiles adicionales. Respondemos los reclamos en un máximo de 15 días hábiles, prorrogables hasta por 8 días hábiles más, también con aviso previo del motivo.': 'Nous répondons aux consultations dans un délai maximal de 10 jours ouvrables ; si nous avons besoin de plus de temps, nous vous en indiquons au préalable le motif et la nouvelle date, qui ne dépassera pas 5 jours ouvrables supplémentaires. Nous répondons aux réclamations dans un délai maximal de 15 jours ouvrables, prorogeable de 8 jours ouvrables au plus, également avec avis préalable du motif.',
    '8. Cuánto tiempo los guardamos': '8. Combien de temps nous les conservons',
    'Hasta 24 meses desde nuestro último contacto, salvo que usted se convierta en cliente o la ley nos pida guardarlos más tiempo.': 'Jusqu’à 24 mois à compter de notre dernier contact, sauf si vous devenez client ou si la loi nous impose de les conserver plus longtemps.',
    '9. Vigencia': '9. Validité',
    'Versión': 'Version',
    ', vigente desde el': ', en vigueur depuis le',
    '. Si cambia, publicaremos la nueva versión en esta página.': '. Si elle change, nous publierons la nouvelle version sur cette page.',

    'Privacidad': 'Confidentialité',
    '© 2026 GTL AI. Todos los derechos reservados.': '© 2026 GTL AI. Tous droits réservés.'
  };

  // Names, initials and addresses read the same in every language.
  ['GTL', 'AI', 'GTL AI', 'Pro', 'GM', 'JG', 'DR', 'DAR', 'Gary Mendez', 'Jesus David Garcia, CFA', 'LinkedIn', 'SA', 'Falco', '夢', 'Angular', 'Excel', 'FP&A', 'Flask', 'Google Cloud', 'Java', 'MongoDB', 'Node.js', 'PostgreSQL', 'Python', 'React', 'Ruby', 'SQL', 'Daniel Rengifo',
    'David Andres Ramirez', 'WhatsApp', 'Gmail', 'Outlook', 'gtlai@gtl-ai.com', 'Alba Fisioterapia', 'Sonríe Dental',
    'Barbería El Bigote', 'Tinta Norte', 'La Fonda de Rosita', 'Natalia Herrera', 'Andrés Rojas', 'Julián Castaño', 'Mariana Gil',
    'Rosa Elvira Pardo', 'NH', 'AR', 'JC', 'MG', 'RP'].forEach(function (k) { EN[k] = k; FR[k] = k; });

  var TABLES = { en: EN, fr: FR };
  var LANGS = ['es', 'en', 'fr'];
  var HTML_LANG = { es: 'es-CO', en: 'en', fr: 'fr' };
  var SWITCH_LABEL = {
    es: 'Idioma: español. Cambiar idioma',
    en: 'Language: English. Change language',
    fr: 'Langue : français. Changer de langue'
  };
  var own = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  var norm = function (v) { return v.replace(/\s+/g, ' ').trim(); };

  // French typography: a no-break space before ? ! : ; » % and after «, between $ and its amount, inside a
  // time ("15 h 30") and between the groups of a number typed "3 000" (prices keep the site's "$ 100.000"),
  // so the table is typed with plain spaces.
  function typo(l, s) {
    if (l !== 'fr') return s;
    return s.replace(/ ([?!:;»%])/g, '\u00a0$1').replace(/« /g, '«\u00a0').replace(/\$ (?=\d)/g, '$\u00a0')
      .replace(/(\d) h (\d\d)\b/g, '$1\u00a0h\u00a0$2').replace(/(\d) h\b/g, '$1\u00a0h')
      .replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u00a0');
  }

  // Texts built from parts: the parts are looked up in the table.
  var MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MONTHS_TO = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  };
  var RULES = [
    // The form's length messages: the field's name and its limit.
    [/^(.+) debe tener al menos (\d+) caracteres\.$/, function (m, l) {
      return word(m[1], l) + (l === 'fr' ? ' doit comporter au moins ' + m[2] + ' caractères.' : ' must be at least ' + m[2] + ' characters.');
    }],
    [/^(.+) no puede superar los (\d+) caracteres\.$/, function (m, l) {
      return word(m[1], l) + (l === 'fr' ? ' ne peut pas dépasser ' + m[2] + ' caractères.' : ' cannot be longer than ' + m[2] + ' characters.');
    }],
    // A date as the privacy page writes it: "30 de octubre de 2026".
    [/^(\d{1,2}) de ([a-z]+) de (\d{4})$/, function (m, l) {
      var i = MONTHS.indexOf(m[2]);
      if (i < 0) return null;
      return l === 'fr' ? (m[1] === '1' ? '1er' : m[1]) + ' ' + MONTHS_TO.fr[i] + ' ' + m[3] : MONTHS_TO.en[i] + ' ' + m[1] + ', ' + m[3];
    }],
    // Who answers for the data, in the privacy policy: the name, NIT, city and address come from the site's config.
    [/^(.+), NIT ([\d.-]+), con domicilio en (.+), Colombia, y dirección (.+)\.$/, function (m, l) {
      return l === 'fr'
        ? m[1] + ', NIT ' + m[2] + ', domiciliée à ' + m[3] + ', Colombie, à l’adresse ' + m[4] + '.'
        : m[1] + ', NIT ' + m[2] + ', domiciled in ' + m[3] + ', Colombia, at ' + m[4] + '.';
    }],
    // A field's name and its message, in the form's list of errors.
    [/^([^:]+): (.+)$/, function (m, l) {
      var a = lookup(m[1], l);
      var b = lookup(m[2], l);
      return a && b ? a + (l === 'fr' ? ' : ' : ': ') + b : null;
    }]
  ];

  function word(s, l) { return own(TABLES[l], s) ? TABLES[l][s] : s; }

  function lookup(text, l) {
    if (own(TABLES[l], text)) return TABLES[l][text];
    for (var i = 0; i < RULES.length; i++) {
      var m = text.match(RULES[i][0]);
      if (m) {
        var r = RULES[i][1](m, l);
        if (r) return r;
      }
    }
    return null;
  }

  // What each table writes: a text that is already in the chosen language is left alone.
  var OUTS = {};
  Object.keys(TABLES).forEach(function (l) {
    OUTS[l] = {};
    Object.keys(TABLES[l]).forEach(function (k) { OUTS[l][norm(typo(l, TABLES[l][k]))] = true; });
  });

  var lang = 'es';
  var texts = new Map();    // text node -> its Spanish text
  var attrs = new Map();    // element -> { attribute: Spanish value }
  var langs = new Map();    // element -> its own lang attribute in Spanish
  // data-message is the note a pricing button puts in the form's message.
  var ATTRS = ['aria-label', 'alt', 'title', 'placeholder', 'data-message'];
  var OFF = '[data-i18n="off"], script, style, noscript';
  var applying = false;
  var missing = [];         // Spanish texts with no translation in the chosen language, for the tests

  var isOff = function (el) { return !el || !!el.closest(OFF); };

  // The Spanish text t in the chosen language, or null (and noted as missing).
  function translated(t) {
    var to = lookup(t, lang);
    if (to === null) {
      if (missing.indexOf(t) < 0) missing.push(t);
      return null;
    }
    to = typo(lang, to);
    OUTS[lang][norm(to)] = true;
    return to;
  }

  function textNode(n) {
    if (isOff(n.parentElement)) return;
    var value = n.nodeValue;
    var t = norm(value);
    if (!t || !/\p{L}/u.test(t) || OUTS[lang][t]) return;
    var to = translated(t);
    if (to === null) return;
    texts.set(n, value);
    n.nodeValue = value.match(/^\s*/)[0] + to + value.match(/\s*$/)[0];
  }

  function attribute(el, name) {
    var v = el.getAttribute(name);
    if (!v || isOff(el)) return;
    var t = norm(v);
    if (OUTS[lang][t] || !/\p{L}/u.test(t)) return;
    var to = translated(t);
    if (to === null) return;
    var saved = attrs.get(el) || {};
    saved[name] = v;
    attrs.set(el, saved);
    el.setAttribute(name, to);
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
      // Links with a version in the chosen language (data-en-href, data-fr-href): a WhatsApp message or an email subject.
      var href = el.getAttribute('data-' + lang + '-href');
      if (href && !isOff(el)) {
        var keep = attrs.get(el) || {};
        keep.href = el.getAttribute('href');
        attrs.set(el, keep);
        el.setAttribute('href', href);
      }
      // A role in one language only (data-fr-role="none": in French the stories' scenarios are not quotations).
      var role = el.getAttribute('data-' + lang + '-role');
      if (role && !isOff(el)) {
        var held = attrs.get(el) || {};
        if (!own(held, 'role')) held.role = el.getAttribute('role');
        attrs.set(el, held);
        el.setAttribute('role', role);
      }
      var l = el.getAttribute('lang');
      if (l && /^es/.test(l) && !isOff(el)) {
        langs.set(el, l);
        el.setAttribute('lang', HTML_LANG[lang]);
      }
    });
  }

  var head = { title: null, description: null };
  var description = document.querySelector('meta[name="description"]');

  // From Spanish to the chosen language.
  function translatePage() {
    applying = true;
    html.setAttribute('lang', HTML_LANG[lang]);
    walk(document.body);
    head.title = document.title;
    var t = lookup(norm(document.title), lang);
    if (t) document.title = typo(lang, t);
    if (description) {
      head.description = description.getAttribute('content');
      var d = lookup(norm(head.description), lang);
      if (d) description.setAttribute('content', typo(lang, d));
    }
    applying = false;
  }

  function toSpanish() {
    applying = true;
    html.setAttribute('lang', HTML_LANG.es);
    texts.forEach(function (value, n) { n.nodeValue = value; });
    attrs.forEach(function (saved, el) {
      Object.keys(saved).forEach(function (a) { if (saved[a] === null) el.removeAttribute(a); else el.setAttribute(a, saved[a]); });
    });
    langs.forEach(function (l, el) { el.setAttribute('lang', l); });
    texts.clear();
    attrs.clear();
    langs.clear();
    if (head.title !== null) document.title = head.title;
    if (description && head.description !== null) description.setAttribute('content', head.description);
    head.title = null;
    head.description = null;
    applying = false;
  }

  // While English or French is on, whatever the page's scripts write in Spanish is translated before it is painted.
  var observer = new MutationObserver(function (records) {
    if (lang === 'es' || applying) return;
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
    // A note for some languages only (data-lang-note="en fr"; with no value, English).
    [].forEach.call(document.querySelectorAll('[data-lang-note]'), function (n) {
      var only = ' ' + (n.getAttribute('data-lang-note') || 'en') + ' ';
      n.hidden = only.indexOf(' ' + lang + ' ') < 0;
    });
    if (!box) return;
    box.setAttribute('data-active', lang);
    current.setAttribute('aria-label', typo(lang, SWITCH_LABEL[lang]));
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
    if (LANGS.indexOf(next) < 0) next = 'es';
    if (remember) {
      try { localStorage.setItem(KEY, next); } catch (err) { /* private mode: this visit only */ }
    }
    if (next === lang) { paintSwitch(); return; }
    // Always through Spanish: the page's own text is what the tables are keyed by.
    if (lang !== 'es') toSpanish();
    lang = next;
    if (lang !== 'es') translatePage();
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
    // Escape closes the menu; the arrows open it and move through the languages, Home and End go to the ends.
    // Enter and Space are the buttons' own.
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!menu.hidden) {
          setOpen(false);
          current.focus();
        }
        return;
      }
      var at = options.indexOf(document.activeElement);
      var last = options.length - 1;
      var to = null;
      if (e.key === 'ArrowDown') to = at < 0 || at === last ? 0 : at + 1;
      else if (e.key === 'ArrowUp') to = at <= 0 ? last : at - 1;
      else if (e.key === 'Home' && !menu.hidden) to = 0;
      else if (e.key === 'End' && !menu.hidden) to = last;
      if (to === null) return;
      e.preventDefault();
      setOpen(true);
      options[to].focus();
    });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) setOpen(false); });
    box.addEventListener('focusout', function (e) { if (e.relatedTarget && !box.contains(e.relatedTarget)) setOpen(false); });
  }

  var start = 'es';
  try {
    var asked = new URLSearchParams(location.search).get('lang');
    if (LANGS.indexOf(asked) >= 0) localStorage.setItem(KEY, asked);
    var kept = localStorage.getItem(KEY);
    if (LANGS.indexOf(kept) >= 0) start = kept;
  } catch (err) {
    var q = location.search.match(/[?&]lang=(en|fr)\b/);
    if (q) start = q[1];
  }

  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  setLang(start, false);
  paintSwitch();
  html.classList.remove('i18n-pending');

  // has(text, l): whether a Spanish text has its translation (English when l is not given), for the tests and
  // for _dev/scripts/check-i18n.mjs. langs: the languages with a table. values: what a table writes.
  window.gtlI18n = { set: function (l) { setLang(l, true); }, get: function () { return lang; }, missing: missing,
    langs: Object.keys(TABLES),
    has: function (text, l) { return lookup(norm(text), l || 'en') !== null; },
    translate: function (text, l) { var to = lookup(norm(text), l); return to === null ? null : typo(l, to); },
    tables: TABLES };
})();
