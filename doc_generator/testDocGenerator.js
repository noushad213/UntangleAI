import { generateCivicForm } from "./formEngine.js";

async function runLiveTest() {
  console.log("================================================================================");
  console.log("CASE 1: Real-world Water Connection Query for Bandra West, Mumbai");
  console.log("================================================================================\n");

  const bandraResult = await generateCivicForm({
    query: "domestic water connection",
    location: "Hill Road, Bandra West, Mumbai",
    applicantDetails: {
      name: "Divya Nair",
      guardianName: "K. R. Nair",
      permanentAddress: "B-204, Sea Green Apartments, Bandra West, Mumbai",
      phone: "+91 98201 12345",
      email: "divya.nair@example.com",
      premiseAddress: "Shop No. 2, Hill Road, Bandra West, Mumbai",
      carpetArea: "450 Sq. Ft.",
      ownerName: "Ashok Singhania",
      ownerAddress: "Flat 12, Pali Hill, Bandra West"
    }
  });

  console.log("Source              :", bandraResult.source);
  console.log("Designated Officer  :", bandraResult.designatedOfficer);
  console.log("Official Gov Link   :", bandraResult.officialPortalLink);
  console.log("Statutory SLA       :", bandraResult.statutoryTimeline);
  console.log("\n--- PRINTABLE STATUTORY FORM DRAFT ---\n");
  console.log(bandraResult.printableFormDraft);

  console.log("\n================================================================================");
  console.log("CASE 2: Commercial Trade License Query for Indiranagar, Bengaluru");
  console.log("================================================================================\n");

  const blrResult = await generateCivicForm({
    query: "commercial trade license for bakery cafe",
    location: "100 Feet Road, Indiranagar, Bengaluru",
    applicantDetails: {
      name: "Siddharth Rao",
      phone: "+91 99000 88776",
      premiseAddress: "Building 45, 100 Feet Road, Indiranagar, Bengaluru"
    }
  });

  console.log("Source              :", blrResult.source);
  console.log("Designated Officer  :", blrResult.designatedOfficer);
  console.log("Official Gov Link   :", blrResult.officialPortalLink);
  console.log("Statutory SLA       :", blrResult.statutoryTimeline);
}

runLiveTest();