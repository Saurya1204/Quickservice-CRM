import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI must be set before running the seed script.');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  const db = mongoose.connection.db;

  // 1. Users
  const usersCollection = db.collection('users');
  await usersCollection.deleteMany({});
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('qsadmin@123', salt);

  await usersCollection.insertMany([
    {
      username: 'admin',
      passwordHash: passwordHash,
      fullName: 'Super Administrator',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      username: 'cco_pooja',
      passwordHash: passwordHash,
      fullName: 'Pooja Verma (CCO)',
      role: 'CCO',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      username: 'bm_rajesh',
      passwordHash: passwordHash,
      fullName: 'Rajesh Sharma (Branch Manager)',
      role: 'BRANCH_MANAGER',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log('Users seeded');

  // 2. Branches
  const branchesCollection = db.collection('branches');
  await branchesCollection.deleteMany({});
  await branchesCollection.insertOne({
    crmCode: 'QSBR001',
    region: 'North',
    branchName: 'Uttar Pradesh Hub',
    contactNumber: '9876543210',
    emailId: 'up.branch@quickserves.com',
    status: 'A',
    address: 'Plot No 12, Industrial Area, Mohan Nagar',
    landmark: 'Near Metro Station',
    pincode: '201007',
    state: 'UTTAR PRADESH',
    district: 'GHAZIABAD',
    city: 'GHAZIABAD',
    locality: 'MOHAN NAGAR',
    gstNumber: '09AAAAA0000A1Z5',
    panNumber: 'AAAAA0000A',
    bankName: 'HDFC Bank',
    bankBranch: 'Ghaziabad Main',
    accountNumber: '50200012345678',
    ifscCode: 'HDFC0001234',
    branchManagerName: 'Rajesh Sharma',
    managerContactNumber: '9876543211',
    managerEmailId: 'rajesh.sharma@quickserves.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 3. Franchises
  const franchisesCollection = db.collection('franchises');
  await franchisesCollection.deleteMany({});
  await franchisesCollection.insertOne({
    crmCode: 'QSSF001',
    region: 'North',
    firmType: 'Proprietorship',
    firmName: 'QUICKSERVES ENTERPRISES',
    numberOfPartners: 1,
    contactNumber: '9810012345',
    emailId: 'franchise.gzb@quickserves.com',
    status: 'A',
    firmAddress: 'Shop 4, Market Complex, Ahinsa Khand 2',
    landmark: 'Opposite Windsor Park',
    pincode: '201014',
    state: 'UTTAR PRADESH',
    district: 'GHAZIABAD',
    city: 'GHAZIABAD',
    locality: 'INDIRAPURAM',
    gstNumber: '09BBBBB1111B1Z2',
    panCardNo: 'BBBBB1111B',
    shopEstablishmentReg: 'REG-UP-2023-8891',
    establishmentMonthYear: '04/2021',
    proprietorName: 'Amit Kumar',
    propContactNumber: '9810012345',
    propEmailId: 'amit.kumar@quickserves.com',
    propResidentialAddress: 'Flat 302, ATS Village, Indirapuram',
    propPanCardNo: 'BBBBB1111B',
    propAadharCardNo: '4455-6677-8899',
    smartphoneAvailability: 'Yes',
    bankName: 'ICICI Bank',
    bankBranch: 'Indirapuram',
    accountHolderName: 'Quickserves Enterprises',
    accountNumber: '112233445566',
    ifscCode: 'ICIC0001122',
    securityAmount: 50000,
    turnOver: 2500000,
    spaceOwnership: 'Rented',
    serviceCentreSpace: '450 sq ft',
    agreementDate: new Date('2023-01-01'),
    validityDate: new Date('2027-12-31'),
    systemAvailability: 'Yes',
    printerAvailability: 'Yes',
    ccoName: 'Pooja Verma',
    ccoContactNumber: '9810054321',
    ccoEmailId: 'pooja.verma@quickserves.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 4. Technicians
  const techniciansCollection = db.collection('technicians');
  await techniciansCollection.deleteMany({});
  await techniciansCollection.insertOne({
    crmCode: 'QSSFT0001',
    region: 'North',
    technicianName: 'PRASHANT GUPTA',
    contactNumber: '9041941903',
    emailId: 'prashant.gupta@quickserves.com',
    status: 'A',
    residentialAddress: 'House 42, Sector 3, Vaishali, Ghaziabad',
    landmark: 'Near Max Hospital',
    pincode: '201010',
    state: 'UTTAR PRADESH',
    district: 'GHAZIABAD',
    city: 'GHAZIABAD',
    locality: 'VAISHALI',
    educationalQualification: 'Graduate',
    technicalQualification: 'HVAC Certified / ITI Electrician',
    identityProofNumber: 'AADHAR-9988-7766-5544',
    panCardNumber: 'ABCDE1234F',
    drivingLicenceNumber: 'DL-UP14-20200009871',
    bankName: 'State Bank of India',
    bankBranch: 'Vaishali',
    accountNumber: '320011223344',
    ifscCode: 'SBIN0001234',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 5. Clients
  const clientsCollection = db.collection('clients');
  await clientsCollection.deleteMany({});
  const clientInsert = await clientsCollection.insertOne({
    clientCode: 'CDCL001',
    clientName: 'MACKAVM INTERNATIONAL PRIVATE LIMITED',
    proprietorName: 'Vikas Mehra',
    status: 'A',
    serviceArea: 'Pan India',
    registeredAddress: 'Plot No. 95, 1st Floor, Sector-5, Bawana DSIDC, Delhi-110039',
    landmark: 'DSIDC Industrial Complex',
    pincode: '110039',
    state: 'DELHI',
    district: 'DELHI',
    city: 'NEW DELHI',
    locality: 'BAWANA',
    contactPerson: 'Vikas Mehra',
    mobileNumber: '9811122233',
    landlineNumber: '011-27750011',
    emailId: 'contact@mackavm.com',
    tollFreeNumber: '1800-120-9988',
    cinNumber: 'U74999DL2018PTC334512',
    panNumber: 'CCCC2222C',
    gstNumber: '07CCCC2222C1Z8',
    callCenter: 'Quickserves',
    noOfCallCentreSeat: 2,
    callCentreSeatCharge: 35000,
    crmCharges: 15000,
    crmExtraUserCharges: 2000,
    warehouseChargePM: 25000,
    minimumGuarantyPM: 50000,
    managementFeeYearly: 120000,
    localConveyanceChargePerKM: 'Rs. 5 Per KM',
    paymentTerms: 'Within 15 Days',
    creditLimit: '6 Lac',
    creditPeriod: '6 Month',
    agreementStartDate: '01/04/2024',
    agreementRenewalDate: '31/03/2027',
    reconciliationPeriod: 'Monthly',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const clientId = clientInsert.insertedId;

  // 6. Brands
  const brandsCollection = db.collection('brands');
  await brandsCollection.deleteMany({});
  const brandInsert = await brandsCollection.insertOne({
    brandCode: 'QSBRD001',
    brandName: 'SAMSUNG',
    clientId: clientId,
    clientName: 'MACKAVM INTERNATIONAL PRIVATE LIMITED',
    status: 'A',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const brandId = brandInsert.insertedId;

  // 7. Categories
  const categoriesCollection = db.collection('categories');
  await categoriesCollection.deleteMany({});
  const categoryNames = [
    'Consumer Electronics',
    'Air Conditioner',
    'Home Appliances',
    'Small Home Appliances',
    'Purifier',
    'Other Electrical',
    'Fitness',
    'Modem/Router (ONT)',
    'Setup Box (STB)',
    'Wi Fi Camera (Xsafe Camera)',
  ];

  const categoryDocs = categoryNames.map((name, i) => ({
    categoryCode: 'CAT' + String(i + 1).padStart(3, '0'),
    categoryName: name,
    description: name + ' service category',
    status: 'A',
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const catInsertResult = await categoriesCollection.insertMany(categoryDocs);
  const catIds = Object.values(catInsertResult.insertedIds);

  // 8. Mapping
  const mappingsCollection = db.collection('clientbrandcategorymappings');
  await mappingsCollection.deleteMany({});
  await mappingsCollection.insertOne({
    clientId: clientId,
    brandId: brandId,
    assignedCategoryIds: [catIds[0], catIds[1], catIds[2]],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 9. MasterEntity (All other Master & Mapping categories requested!)
  const masterEntitiesCollection = db.collection('masterentities');
  await masterEntitiesCollection.deleteMany({});

  const masterItems = [
    // Freelancers
    {
      entityType: 'freelancerMaster',
      code: 'QSFL001',
      name: 'Ramesh Yadav',
      category: 'Air Conditioner & Refrigeration',
      subText: 'Indirapuram & Vaishali Sector',
      field1: '9871199882',
      field2: 'GHAZIABAD',
      field3: 'ITI Certified',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      entityType: 'freelancerMaster',
      code: 'QSFL002',
      name: 'Deepak Chauhan',
      category: 'Smart TV & Audio Systems',
      subText: 'Noida Sector 62 & 63',
      field1: '9810055443',
      field2: 'NOIDA',
      field3: 'Electronics Diploma',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Products
    {
      entityType: 'productMaster',
      code: 'QSPRD001',
      name: 'Split Inverter Air Conditioner',
      category: 'Air Conditioner',
      subText: '1.5 Ton Copper Condenser Series',
      field1: 'SAMSUNG',
      field2: '12 Months Warranty',
      field3: 'Dual Inverter Technology',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      entityType: 'productMaster',
      code: 'QSPRD002',
      name: 'Frost Free Double Door Refrigerator',
      category: 'Home Appliances',
      subText: '253 Litre Inverter Convertible',
      field1: 'SAMSUNG',
      field2: '24 Months Warranty',
      field3: 'Digital Inverter Compressor',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      entityType: 'productMaster',
      code: 'QSPRD003',
      name: '4K Ultra HD Smart LED TV 55 Inch',
      category: 'Consumer Electronics',
      subText: 'Crystal 4K UHD Series',
      field1: 'SAMSUNG',
      field2: '36 Months Warranty',
      field3: 'Tizen OS Panel',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Models
    {
      entityType: 'modelMaster',
      code: 'QSMOD001',
      name: 'AR18CY3ZAWK',
      category: 'Split Inverter Air Conditioner',
      subText: '1.5T 3-Star WindFree Inverter',
      field1: 'SAMSUNG',
      field2: 'Air Conditioner',
      field3: 'R32 Gas',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      entityType: 'modelMaster',
      code: 'QSMOD002',
      name: 'RT28A3022GS',
      category: 'Double Door Refrigerator',
      subText: '253L Elegant Inox Finish',
      field1: 'SAMSUNG',
      field2: 'Home Appliances',
      field3: 'Smart Connect Inverter',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Symptoms
    {
      entityType: 'symptomMaster',
      code: 'QSSYM001',
      name: 'No Cooling / Weak Airflow',
      category: 'Air Conditioner',
      subText: 'Compressor running but room not cooling',
      field1: 'High Severity',
      field2: 'Cooling Unit',
      field3: 'Standard Checklist',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      entityType: 'symptomMaster',
      code: 'QSSYM002',
      name: 'Indoor Water Leakage',
      category: 'Air Conditioner',
      subText: 'Water dripping from blower drain outlet',
      field1: 'Medium Severity',
      field2: 'Drain Section',
      field3: 'Tray Flush Required',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Causes
    {
      entityType: 'causeMaster',
      code: 'QSCAU001',
      name: 'Low Gas Pressure / Refrigerant Leak',
      category: 'Air Conditioner',
      subText: 'Flare nut leak on suction valve',
      field1: 'Capillary / Valve',
      field2: 'QSSYM001',
      field3: 'Pressure Check',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      entityType: 'causeMaster',
      code: 'QSCAU002',
      name: 'Drain Hose Choked With Dust/Algae',
      category: 'Air Conditioner',
      subText: 'Blocked drain tray outlet pipe',
      field1: 'Drain System',
      field2: 'QSSYM002',
      field3: 'De-clogging',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Analysis
    {
      entityType: 'analysisMaster',
      code: 'QSANL001',
      name: 'Nitrogen Test, Flare Rectification & Gas Charging',
      category: 'Air Conditioner',
      subText: 'Standard operating repair sequence for gas leaks',
      field1: '90 Mins SOP',
      field2: 'QSCAU001',
      field3: 'Leak Proof Guarantee',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      entityType: 'analysisMaster',
      code: 'QSANL002',
      name: 'Pressure Wash Cleaning of Drain Pan & Hose Flush',
      category: 'Air Conditioner',
      subText: 'Clear drain obstructions and level indoor unit',
      field1: '30 Mins SOP',
      field2: 'QSCAU002',
      field3: 'Standard Service',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Spares
    {
      entityType: 'sparesMaster',
      code: 'QSSPR001',
      name: 'R32 Refrigerant Gas Cylinder (10 Kg)',
      category: 'Spares Inventory',
      subText: 'Authorized Grade Pure R32',
      field1: '₹ 4,800.00',
      field2: 'Stock: 45 Cylinders',
      field3: 'Reorder Level: 10',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      entityType: 'sparesMaster',
      code: 'QSSPR002',
      name: 'Inverter AC Outdoor PCB Assembly',
      category: 'Spares Inventory',
      subText: 'Original Samsung Part DB92-04024A',
      field1: '₹ 3,250.00',
      field2: 'Stock: 18 Units',
      field3: 'Reorder Level: 5',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Cities
    {
      entityType: 'cityMaster',
      code: 'QSCTY001',
      name: 'GHAZIABAD',
      category: 'UTTAR PRADESH',
      subText: 'North Region Tier-1 Hub',
      field1: 'PIN: 201001-201014',
      field2: 'Active ASC: 4',
      field3: 'Hub Active',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      entityType: 'cityMaster',
      code: 'QSCTY002',
      name: 'NOIDA',
      category: 'UTTAR PRADESH',
      subText: 'Gautam Buddha Nagar Hub',
      field1: 'PIN: 201301-201310',
      field2: 'Active ASC: 3',
      field3: 'Hub Active',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      entityType: 'cityMaster',
      code: 'QSCTY003',
      name: 'NEW DELHI',
      category: 'DELHI',
      subText: 'Capital Region Metro Area',
      field1: 'PIN: 110001-110096',
      field2: 'Active ASC: 8',
      field3: 'Hub Active',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Localities
    {
      entityType: 'localityMaster',
      code: 'QSLOC001',
      name: 'INDIRAPURAM',
      category: 'GHAZIABAD',
      subText: 'Ahinsa Khand, Vaibhav Khand, Nyay Khand',
      field1: 'PIN: 201014',
      field2: 'High Volume Density',
      field3: 'Franchise: QSSF001',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      entityType: 'localityMaster',
      code: 'QSLOC002',
      name: 'VAISHALI',
      category: 'GHAZIABAD',
      subText: 'Sectors 1 to 9, Metro Corridor',
      field1: 'PIN: 201010',
      field2: 'High Volume Density',
      field3: 'Franchise: QSSF001',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Vendors
    {
      entityType: 'vendorMaster',
      code: 'QSVND001',
      name: 'National Cooling Spares Pvt Ltd',
      category: 'Refrigerants & Copper Parts',
      subText: 'Authorized Wholesale Distributor',
      field1: 'GST: 07AABCN1234F1Z8',
      field2: 'Mob: 9811002233',
      field3: 'Delhi Central',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Brand Mapping
    {
      entityType: 'brandMapping',
      code: 'MAP-BRD-001',
      name: 'SAMSUNG ➔ North Zone ASC Network',
      category: 'MACKAVM INTERNATIONAL',
      subText: 'Mapped to Ghaziabad, Noida and Central Delhi Hubs',
      field1: 'Client: CDCL001',
      field2: 'ASC Count: 6',
      field3: 'Live Mapped',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Pincode Mapping
    {
      entityType: 'pincodeMapping',
      code: 'MAP-PIN-001',
      name: 'Pincode 201014 ➔ QUICKSERVES ENTERPRISES',
      category: 'Indirapuram Territory',
      subText: 'Auto-allotment priority: Franchise QSSF001',
      field1: 'SLA: 4 Hours',
      field2: 'Technicians: 8',
      field3: 'Live Active',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Warehouse Mapping
    {
      entityType: 'warehouseMapping',
      code: 'MAP-WH-001',
      name: 'Mohan Nagar Spares Warehouse ➔ Ghaziabad Hub',
      category: 'Primary Distribution',
      subText: 'Daily stock replenishment route',
      field1: 'Capacity: 5000 Units',
      field2: 'Route: GT Road',
      field3: 'Active',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await masterEntitiesCollection.insertMany(masterItems);
  console.log(`Seeded ${masterItems.length} dynamic master & mapping items!`);

  // 10. Service Calls
  const callsCollection = db.collection('servicecalls');
  await callsCollection.deleteMany({});
  const sampleCalls = [
    {
      callNo: 'QS-CALL-1001',
      customerName: 'Rahul Verma',
      customerMobile: '9818812345',
      customerAddress: 'Flat 502, Express Garden, Vaibhav Khand, Indirapuram',
      city: 'GHAZIABAD',
      state: 'UTTAR PRADESH',
      pincode: '201014',
      clientName: 'MACKAVM INTERNATIONAL PRIVATE LIMITED',
      brandName: 'SAMSUNG',
      categoryName: 'Air Conditioner',
      reportedFault: 'AC not cooling properly, blowing room temperature air',
      callStatus: 'OPEN',
      daysPending: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      callNo: 'QS-CALL-1002',
      customerName: 'Neha Sharma',
      customerMobile: '9871123456',
      customerAddress: 'Tower B-1402, Shipra Riviera, Gyan Khand',
      city: 'GHAZIABAD',
      state: 'UTTAR PRADESH',
      pincode: '201014',
      clientName: 'MACKAVM INTERNATIONAL PRIVATE LIMITED',
      brandName: 'SAMSUNG',
      categoryName: 'Home Appliances',
      reportedFault: 'Refrigerator freezer cooling fine but lower cabinet warm',
      callStatus: 'OPEN',
      daysPending: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      callNo: 'QS-CALL-1003',
      customerName: 'Sanjay Gupta',
      customerMobile: '9910098765',
      customerAddress: 'B-23, Sector 62, Noida',
      city: 'NOIDA',
      state: 'UTTAR PRADESH',
      pincode: '201309',
      clientName: 'MACKAVM INTERNATIONAL PRIVATE LIMITED',
      brandName: 'SAMSUNG',
      categoryName: 'Consumer Electronics',
      reportedFault: 'Smart TV display flickering with vertical lines',
      callStatus: 'OPEN',
      daysPending: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      callNo: 'QS-CALL-1004',
      customerName: 'Anil Malhotra',
      customerMobile: '9810011223',
      customerAddress: 'C-89, Preet Vihar, Delhi',
      city: 'DELHI',
      state: 'DELHI',
      pincode: '110092',
      clientName: 'MACKAVM INTERNATIONAL PRIVATE LIMITED',
      brandName: 'SAMSUNG',
      categoryName: 'Air Conditioner',
      reportedFault: 'Split AC water leaking inside the room',
      technicianName: 'PRASHANT GUPTA',
      callStatus: 'ALLOTED',
      daysPending: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      callNo: 'QS-CALL-1005',
      customerName: 'Sunita Mehra',
      customerMobile: '9820033445',
      customerAddress: 'Plot 78, Kaushambi, Ghaziabad',
      city: 'GHAZIABAD',
      state: 'UTTAR PRADESH',
      pincode: '201010',
      clientName: 'MACKAVM INTERNATIONAL PRIVATE LIMITED',
      brandName: 'SAMSUNG',
      categoryName: 'Purifier',
      reportedFault: 'RO Water purifier filter jammed, low pressure',
      technicianName: 'PRASHANT GUPTA',
      callStatus: 'PART_PENDING',
      daysPending: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  await callsCollection.insertMany(sampleCalls);
  console.log(`Seeded ${sampleCalls.length} service calls!`);

  console.log('\nAll complete master data seeded into MongoDB successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
