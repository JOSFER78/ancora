const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ysnorelkaccaikvuqgnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzbm9yZWxrYWNjYWlrdnVxZ252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTg3NTYsImV4cCI6MjA5NDc3NDc1Nn0.iLZj0sbmyr6wMJEIeWG2B0kmo4yeVJJFaL9nEgJZmrs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log("Logging in as Emilio demo...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'josferestudio@gmail.com',
      password: '111111'
    });

    if (authError) {
      throw new Error("Auth error: " + authError.message);
    }

    console.log("Logged in successfully! Token length:", authData.session.access_token.length);

    console.log("Invoking Edge Function 'chat-terapeuta'...");
    const { data: funcData, error: funcError } = await supabase.functions.invoke('chat-terapeuta', {
      body: {
        conversationId: '39ce24d8-11ca-46c5-a908-8a71e2715e23',
        messages: [
          { role: 'assistant', content: 'Hola Emilio. Soy Walter. Estoy aquí contigo tanto para ayudarte a reprocesar tu ansiedad y tus bloqueos emocionales, como para vigilar de cerca tu gestión de riesgos en el mercado. Recuerda: Lola te necesita sano, estable y en casa, no millonario. ¿Cómo te encuentras hoy en tu habitación? ¿Has tomado tu Atomoxetina?' },
          { role: 'user', content: 'hola ves el titulo¿ el tema es que he olvidado que siempre siempre, desde los 12 o asi me he sentido fracasado, que no vlago, que no hago nada util y un sueño recuerrente que acabaria en la calle pidiendo, incluso en epocas de ganar 10mil al mes y viajando por todo el mundo conmi exy mi hija con una vida sin proeblmas' },
          { role: 'user', content: 'quiero indagar en esto, no lo siento' }
        ]
      }
    });

    if (funcError) {
      console.error("\n--- Edge Function Error (from SDK) ---");
      console.error(funcError);
    } else {
      console.log("\n--- Edge Function Response ---");
      console.log(funcData);
    }

  } catch (err) {
    console.error("Execution error:", err.message);
  }
}

run();
