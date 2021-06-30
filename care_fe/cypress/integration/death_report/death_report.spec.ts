import { cy, it, describe } from "local-cypress";

const user = { username: "devdistrictadmin", password: "Coronasafe@123" };
const address = "C-106,\nSector-H,\nAliganj,\nLucknow,\nUttar Pradesh";

describe("Death Report", () => {
  it("Add Data And Submit " + user.username, () => {
    cy.visit("http://localhost:4000/");

    // Login
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get("button").contains("Login").click();
    cy.url().should("include", "/facility");

    // Paitents Page
    cy.get("a").contains("Patients").click();
    cy.url().should("include", "/patients");

    // Patient Details
    cy.get("div").contains("Details").click();
    cy.url().should("include", "/patient");

    // Open Death Form
    cy.get('button[name="death_report"]').click();
    cy.url().should("include", "/death_report");

    // Wait For Form Data To Prepopulate
    cy.wait(1000);

    // Clear Exisiting Data And Fill New Data
    cy.get('input[name="name"]').clear().type("Apurva Nagar");
    cy.get('input[name="age"]').clear().type("20");
    cy.get('input[name="gender"]').clear().type("Male");
    cy.get('textarea[name="address"]').clear().type(address);
    cy.get('input[name="phone_number"]').clear().type("+919919266674");
    cy.get('input[name="is_declared_positive"]').clear().type("No");
    cy.get('input[name="date_declared_positive"]').clear().type("2021-12-01");
    cy.get('input[name="test_type"]').clear().type("Rapid Antigen");
    cy.get('input[name="date_of_test"]').clear().type("2021-12-01");
    cy.get('input[name="date_of_result"]').clear().type("2021-12-01");
    cy.get('input[name="hospital_tested_in"]').clear().type("Apollo Hospital");
    cy.get('input[name="hospital_died_in"]').clear().type("Apollo Hospital");
    cy.get('input[name="date_of_admission"]').clear().type("2021-12-01");
    cy.get('input[name="date_of_death"]').clear().type("2021-12-01");
    cy.get('input[name="comorbidities"]').clear().type("awesomeness");
    cy.get('input[name="history_clinical_course"]')
      .clear()
      .type("No cure for awesomeness");
    cy.get('input[name="brought_dead"]').clear().type("No");
    cy.get('input[name="home_or_cfltc"]').clear().type("-");
    cy.get('input[name="is_vaccinated"]').clear().type("Yes");
    cy.get('input[name="kottayam_confirmation_sent"]').clear().type("Yes");
    cy.get('input[name="kottayam_sample_date"]').clear().type("2021-12-01");
    cy.get('input[name="cause_of_death"]')
      .clear()
      .type("Too awesome for earth");
    cy.get('input[name="srf_id"]').clear().type("123456");

    // See Preview Of Report
    cy.get("button").contains("Preview").click();

    // Print Death Report
    cy.get("button").contains("Print Death Report").click();
  });
});
