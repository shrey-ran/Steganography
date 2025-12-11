# Ethics Banner Text - Canonical Wording

## Overview

This document contains the **required** ethics banner text that MUST be displayed prominently in all interfaces, documentation, and communications related to this steganography research project.

## Required Banner Text

### Standard Version (Full Text)

```
⚠️ ETHICS NOTICE ⚠️

This steganography research system is for AUTHORIZED EDUCATIONAL AND RESEARCH 
PURPOSES ONLY. Misuse of steganography technology can cause serious harm.

PROHIBITED USES:
• Evading content moderation or security systems
• Concealing malware or facilitating illegal activities
• Violating intellectual property rights or terms of service
• Any use that could harm individuals or organizations

REQUIRED BEFORE USE:
• Supervisor/IRB approval
• Ethics training completion
• Authorized dataset verification
• Intended use documentation

By using this system, you acknowledge responsibility for ethical and legal 
compliance. Violations will result in immediate access termination and may 
be subject to academic or legal consequences.

For questions: Contact your research supervisor or institutional ethics board.
```

### Compact Version (UI Display)

```
⚠️ RESEARCH USE ONLY • SUPERVISOR APPROVAL REQUIRED
Steganography research for authorized educational purposes only.
Misuse prohibited. Ethics compliance mandatory.
```

### Minimal Version (CLI/Logs)

```
[ETHICS] Research use only. Supervisor approval required.
```

## Implementation Requirements

### 1. Where to Display

**MANDATORY Display Locations:**
- [ ] Application login/startup screen (full text)
- [ ] README.md file header (full text)
- [ ] API endpoint responses for encode/extract operations (compact)
- [ ] Command-line tool startup (standard or compact)
- [ ] Web UI footer (compact with link to full text)
- [ ] Documentation homepage (full text)
- [ ] Configuration file comments (reference to this document)

**RECOMMENDED Display Locations:**
- Source code headers in sensitive files (minimal)
- Git commit messages for implementation changes (minimal)
- Presentation slides about the project (compact)
- Research paper acknowledgments (standard)

### 2. Display Timing

**Banner must be shown:**
- On first application launch
- Before any encode/extract operation
- When accessing configuration files
- During installation/setup
- At least once per session for interactive tools

### 3. Acknowledgment Requirements

For interactive systems, users MUST:
- Read the full ethics banner
- Acknowledge understanding (checkbox, typed confirmation, etc.)
- Provide supervisor approval documentation
- Re-acknowledge every 90 days

**Example Acknowledgment Prompt:**
```
I have read and understand the ethics notice above. I confirm that:
[x] I have supervisor/IRB approval for this research
[x] I will use this system only for authorized educational/research purposes
[x] I will not use this system for any prohibited purposes
[x] I understand violations may result in serious consequences

Type "I AGREE" to continue: _____
```

## Supervisor/IRB Approval Process

### Step 1: Document Intended Use

Before requesting approval, prepare a written document including:

**Research Plan:**
- Project title and description
- Research objectives and methodology
- Expected outcomes and deliverables
- Timeline and milestones
- Team members and roles

**Technical Details:**
- Datasets to be used (with sources and licenses)
- Steganography techniques to be implemented
- Computing resources required
- Data storage and security measures

**Ethics Considerations:**
- Potential risks and mitigation strategies
- Safeguards against misuse
- Data privacy protections
- Compliance with institutional policies

**Intended Use Cases:**
- Specific experiments to be conducted
- Scope limitations (what will NOT be done)
- Publication/dissemination plans

### Step 2: Obtain Supervisor Approval

Submit research plan to your academic supervisor for review. Supervisor must:

1. Review the research plan thoroughly
2. Assess ethics compliance
3. Verify student training and readiness
4. Sign the approval form (template below)
5. Maintain approval documentation

### Step 3: IRB Review (if required)

**When IRB review is required:**
- Research involves human subjects
- Data collection from users/participants
- Publication of results
- Use of sensitive datasets
- As determined by institutional policy

**IRB Submission Process:**
- Contact your institutional review board
- Submit research protocol
- Include ethics safeguards
- Wait for approval before proceeding
- Maintain IRB approval documentation

### Step 4: Document and Maintain Approval

- Store approval documents securely
- Include approval reference in project documentation
- Review and renew annually or as required
- Update approval if project scope changes

## Supervisor Approval Form Template

```
═══════════════════════════════════════════════════════════════════════════
                    STEGANOGRAPHY RESEARCH PROJECT
                      SUPERVISOR APPROVAL FORM
═══════════════════════════════════════════════════════════════════════════

PROJECT INFORMATION
─────────────────────────────────────────────────────────────────────────
Project Title:    ___________________________________________________________

Student Name:     ___________________________________________________________

Student ID:       ___________________________________________________________

Institution:      ___________________________________________________________

Department:       ___________________________________________________________

Course/Program:   ___________________________________________________________


RESEARCH SUMMARY
─────────────────────────────────────────────────────────────────────────
Brief Description (2-3 sentences):

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________


Intended Use Cases:

[ ] Algorithm development and testing
[ ] Dataset transformation experiments
[ ] Performance/imperceptibility analysis
[ ] Security analysis and robustness testing
[ ] Educational demonstration
[ ] Other: _______________________________________________________________


Datasets to be Used:

Dataset Name          Source/License          Size/Scope
_________________    ___________________    _______________________________

_________________    ___________________    _______________________________

_________________    ___________________    _______________________________


ETHICS COMPLIANCE CHECKLIST
─────────────────────────────────────────────────────────────────────────

Student confirms:
[ ] I have read and understand the ethics banner and guidelines
[ ] I will use this system only for authorized research purposes
[ ] I will not use this system for any prohibited purposes
[ ] I have completed required ethics training (if applicable)
[ ] I understand the potential harms and misuse scenarios
[ ] I will implement appropriate safeguards
[ ] I will not publish code/results without supervisor approval
[ ] I will comply with all institutional policies

Supervisor confirms:
[ ] I have reviewed the student's research plan
[ ] The proposed research is appropriate for the student's level
[ ] Adequate safeguards are in place to prevent misuse
[ ] The student has received appropriate ethics training
[ ] Dataset usage is authorized and properly licensed
[ ] IRB approval obtained (if required) - IRB #: ____________
[ ] I will provide ongoing supervision and oversight
[ ] I approve this student to proceed with this research


RISK ASSESSMENT
─────────────────────────────────────────────────────────────────────────

Primary risks identified:

1. ________________________________________________________________________

2. ________________________________________________________________________

3. ________________________________________________________________________


Mitigation measures:

1. ________________________________________________________________________

2. ________________________________________________________________________

3. ________________________________________________________________________


SCOPE LIMITATIONS
─────────────────────────────────────────────────────────────────────────

The following are explicitly EXCLUDED from this approval:

[ ] Production deployment or public release
[ ] Processing of user-submitted content
[ ] Real-world data collection from users
[ ] Adversarial testing on third-party systems
[ ] Other: _______________________________________________________________


APPROVAL
─────────────────────────────────────────────────────────────────────────

Student Signature:     ____________________________   Date: _______________

Printed Name:          ________________________________________________________


Supervisor Signature:  ____________________________   Date: _______________

Printed Name:          ________________________________________________________

Title:                 ________________________________________________________

Email:                 ________________________________________________________

Phone:                 ________________________________________________________


VALIDITY
─────────────────────────────────────────────────────────────────────────

This approval is valid from: __________________  to: __________________

Review/renewal required: [ ] Annually  [ ] Upon scope change  [ ] Other: ______


EMERGENCY CONTACT
─────────────────────────────────────────────────────────────────────────

In case of ethics violations or concerns, contact:

Name:        _______________________________________________________________

Title:       _______________________________________________________________

Email:       _______________________________________________________________

Phone:       _______________________________________________________________

═══════════════════════════════════════════════════════════════════════════
                            APPROVALS AND SIGNATURES
═══════════════════════════════════════════════════════════════════════════

Approved by (Supervisor):

Name:       ________________________________________  Date: ________________

Signature:  ________________________________________


Acknowledged by (Department Head, if required):

Name:       ________________________________________  Date: ________________

Signature:  ________________________________________


IRB Approval (if required):

IRB Number: ________________________________________  Date: ________________

═══════════════════════════════════════════════════════════════════════════

                         KEEP THIS FORM ON FILE
          Include reference to this approval in project documentation
                   Update immediately if project scope changes

═══════════════════════════════════════════════════════════════════════════
```

## Example Completed Approval Block

```
═══════════════════════════════════════════════════════════════════════════
ETHICS APPROVAL - EXAMPLE (DO NOT USE AS-IS)
═══════════════════════════════════════════════════════════════════════════

Project: Image Steganography Algorithm Comparison Study
Student: Jane Doe (ID: 12345678)
Institution: Example University, Computer Science Department
Supervisor: Dr. John Smith

Approved Uses:
✓ Testing JPEG compression resistance
✓ Comparing LSB vs DCT-based methods
✓ Performance benchmarking on public datasets

Prohibited:
✗ No deployment to production systems
✗ No processing of user-submitted content
✗ No adversarial testing on third-party platforms

Datasets:
- ImageNet sample (1000 images, CC-BY license)
- COCO validation set (public domain)
- Self-generated test patterns

Approval Date: December 7, 2025
Valid Until: December 7, 2026
IRB Status: Not required (no human subjects)

Supervisor Signature: [Signed] Dr. John Smith
Date: December 7, 2025

═══════════════════════════════════════════════════════════════════════════
```

## Updating the Banner

### When Updates Are Required

- Changes to institutional policy
- New legal requirements identified
- Security incidents or misuse discoveries
- IRB or supervisor recommendations
- Annual review process

### Update Process

1. Draft proposed changes with justification
2. Review with supervisor and/or ethics board
3. Document version history
4. Update all implementations
5. Notify all users of changes
6. Require re-acknowledgment from users

### Version History

**v1.0** - December 7, 2025 - Initial canonical wording established

## Compliance Verification

### Self-Audit Checklist

Conduct this audit before any research use:

- [ ] Ethics banner displayed in all required locations
- [ ] Supervisor approval form completed and signed
- [ ] IRB approval obtained (if required)
- [ ] All team members have acknowledged ethics guidelines
- [ ] Dataset licenses verified and documented
- [ ] Access controls implemented
- [ ] Logging/audit trail enabled
- [ ] Emergency contact information updated
- [ ] Safeguards against misuse implemented
- [ ] Scope limitations clearly documented

### Incident Reporting

If ethics violations are suspected or discovered:

1. **STOP** using the system immediately
2. Document the incident (what, when, who, how)
3. Contact supervisor within 24 hours
4. Preserve all relevant logs and evidence
5. Follow institutional incident reporting procedures
6. Implement corrective measures before resuming
7. Update documentation and safeguards

### Annual Review

Every 12 months, complete:

- [ ] Review and update ethics banner if needed
- [ ] Renew supervisor approval
- [ ] Verify IRB approval current (if applicable)
- [ ] Audit actual usage against approved scope
- [ ] Review and update risk mitigation measures
- [ ] Update emergency contact information
- [ ] Train any new team members
- [ ] Document review completion

## Questions and Support

### Common Questions

**Q: Do I need IRB approval for algorithm development?**  
A: Generally no, if using public datasets and no human subjects. Check with your IRB.

**Q: Can I share my code on GitHub?**  
A: Only with explicit supervisor approval and appropriate ethics disclaimers.

**Q: What if my research scope changes?**  
A: Update your approval form immediately and get supervisor re-approval.

**Q: How long does approval take?**  
A: Supervisor approval: 1-2 weeks. IRB approval (if needed): 4-8 weeks.

### Contact Information

For ethics guidance, contact:

- **Your Supervisor** (primary contact)
- **Institutional Ethics Board/IRB**
- **Department Ethics Advisor**
- **University Research Compliance Office**

## Legal Disclaimer

This ethics banner and approval process are designed to promote responsible research practices. They do not constitute legal advice. Researchers are responsible for compliance with all applicable laws, regulations, and institutional policies. Consult appropriate legal and ethics professionals for your specific situation.

---

**Document Version:** 1.0  
**Last Updated:** December 7, 2025  
**Next Review:** December 7, 2026  
**Maintained By:** Project Ethics Committee  
**Contact:** [Your Supervisor/Ethics Board]
