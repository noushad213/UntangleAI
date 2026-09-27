import { generateCivicForm } from "./formEngine.js";

const args = process.argv.slice(2);
const query = args[0] || "water connection";
const location = args[1] || "Kothrud, Pune";

async function main() {
  console.log("\n=======================================================");
  console.log(`🔎 SEARCHING FOR QUERY    : "${query}"`);
  console.log(`📍 AT LOCATION            : "${location}"`);
  console.log("=======================================================\n");

  try {
    const result = await generateCivicForm({ query, location });

    console.log(`⚡ Source              : ${result.source}`);
    console.log(`🏛️ Target Civic Office  : ${result.resolvedCivicOffice.officeName}`);
    console.log(`📍 Ward / Zone         : ${result.resolvedCivicOffice.administrativeZone}`);
    console.log(`🏢 Department Assigned : ${result.departmentAssigned}`);
    console.log(`📋 Designated Officer  : ${result.designatedOfficer}`);
    console.log(`⏱️ Statutory SLA Time  : ${result.statutoryTimeline}`);
    console.log(`💰 Estimated Fee       : ${result.estimatedFee}`);
    console.log(`🌐 Live Official Link  : ${result.officialPortalLink}`);
    console.log(`📞 Official Helpline   : ${result.helplinePhone}`);
    if (result.whatsappBot && result.whatsappBot !== "N/A") {
      console.log(`💬 WhatsApp Bot        : ${result.whatsappBot}`);
    }
    console.log(`🏢 Helpdesk Counter    : ${result.helpdeskDesk} (${result.workingHours})`);

    if (!result.requiresForm) {
      console.log("\n-------------------------------------------------------");
      console.log("ℹ️  NO STATUTORY FORM REQUIRED FOR THIS REQUEST");
      console.log("-------------------------------------------------------");
      console.log("Your query is a general guidance and process inquiry. A formal statutory application form is not required for this request.");
      console.log(`\n• Official Helpline: You can call [${result.helplinePhone}] directly for guided assistance.`);
      console.log(`• Official Portal  : You can visit [${result.officialPortalLink}] for official online guidelines.`);
      console.log(`• Physical Counter : For in-person consultation, please visit the "${result.helpdeskDesk}" at ${result.resolvedCivicOffice.officeName}.`);
      console.log("-------------------------------------------------------\n");
    } else {
      console.log("\n📄 --- OFFICIAL STATUTORY FORM / LETTER PREVIEW ---\n");
      console.log(result.printableFormDraft);
      console.log("\n=======================================================\n");
    }

  } catch (err) {
    console.error("❌ Error generating form:", err.message);
  }
}

main();