import { connectDB } from '@/lib/db';
import { ServiceCall } from '@/models/ServiceCall';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { StockInventory } from '@/models/StockInventory';
import { DefectiveReturn } from '@/models/DefectiveReturn';
import { PartDemand } from '@/models/PartDemand';
import { PartConsumption } from '@/models/PartConsumption';

export interface IReportResponse {
  reportKey: string;
  title: string;
  section: 'Pending' | 'Other';
  dateRange: { from: string; to: string };
  totalCount: number;
  columns: Array<{ key: string; label: string }>;
  data: any[];
}

export class ReportService {
  private static parseDateRange(fromDate?: string | null, toDate?: string | null) {
    const from = fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : new Date('2020-01-01T00:00:00.000Z');
    const to = toDate ? new Date(`${toDate}T23:59:59.999Z`) : new Date('2030-12-31T23:59:59.999Z');
    return { from, to };
  }

  // 1. Pending Open Call
  static async getPendingOpenCalls(): Promise<IReportResponse> {
    await connectDB();
    const calls = await ServiceCall.find({
      callStatus: { $nin: ['COMPLETED', 'CANCEL'] },
    }).sort({ createdAt: -1 });

    const columns = [
      { key: 'callNo', label: 'Call Number' },
      { key: 'regDate', label: 'Call Registration Date' },
      { key: 'clientName', label: 'Client' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'customerMobile', label: 'Contact Number' },
      { key: 'productName', label: 'Product' },
      { key: 'modelNo', label: 'Model Number' },
      { key: 'serialNo', label: 'Serial Number' },
      { key: 'reportedFault', label: 'Complaint / Symptom' },
      { key: 'technicianName', label: 'Assigned Engineer' },
      { key: 'callStatus', label: 'Call Status' },
      { key: 'daysPending', label: 'Pending Duration' },
    ];

    const data = calls.map((c) => ({
      callNo: c.callNo,
      regDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      clientName: c.clientName || 'General Client',
      customerName: c.customerName,
      customerMobile: c.customerMobile,
      productName: c.productName || `${c.brandName} ${c.categoryName}`,
      modelNo: c.modelNo || 'N/A',
      serialNo: c.serialNo || 'N/A',
      reportedFault: c.symptomName || c.reportedFault,
      technicianName: c.technicianName || 'Unassigned',
      callStatus: c.callStatus,
      daysPending: `${c.daysPending || 0} Days`,
    }));

    return {
      reportKey: 'pendingOpenCalls',
      title: 'Pending Open Call Report',
      section: 'Pending',
      dateRange: { from: 'All Time', to: 'Current' },
      totalCount: data.length,
      columns,
      data,
    };
  }

  // 2. Pending For Part
  static async getPendingForParts(): Promise<IReportResponse> {
    await connectDB();
    // Service calls waiting for spare parts
    const calls = await ServiceCall.find({
      $or: [{ callStatus: 'PART_PENDING' }, { 'daysPending': { $gt: 0 } }],
    }).sort({ createdAt: -1 });

    const partDemands = await PartDemand.find({
      demandStatus: { $in: ['Pending', 'Approved', 'Partially Issued'] },
    });

    const demandMap = new Map<string, any>();
    partDemands.forEach((d) => demandMap.set(d.callNo, d));

    const columns = [
      { key: 'callNo', label: 'Call Number' },
      { key: 'callDate', label: 'Call Date' },
      { key: 'clientName', label: 'Client' },
      { key: 'customerName', label: 'Customer' },
      { key: 'productName', label: 'Product' },
      { key: 'modelNo', label: 'Model Number' },
      { key: 'requiredSpare', label: 'Required Spare Part' },
      { key: 'partCode', label: 'Part Code' },
      { key: 'qtyRequired', label: 'Quantity Required' },
      { key: 'qtyAvailable', label: 'Quantity Available' },
      { key: 'pendingQty', label: 'Pending Quantity' },
      { key: 'poStatus', label: 'PO Status' },
      { key: 'daysPending', label: 'Pending Duration' },
    ];

    const data = calls.map((c) => {
      const dem = demandMap.get(c.callNo);
      return {
        callNo: c.callNo,
        callDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
        clientName: c.clientName,
        customerName: c.customerName,
        productName: c.productName || `${c.brandName} ${c.categoryName}`,
        modelNo: c.modelNo || 'TEST-MDL-3419',
        requiredSpare: dem?.spareName || 'Copper Condenser Coil Tube',
        partCode: dem?.partCode || 'PRT-3661',
        qtyRequired: dem?.quantityDemanded || 1,
        qtyAvailable: 0,
        pendingQty: dem?.outstandingQuantity || 1,
        poStatus: dem ? 'PO Raised / Dispatched' : 'PO Pending Approval',
        daysPending: `${c.daysPending || 3} Days`,
      };
    });

    return {
      reportKey: 'pendingForParts',
      title: 'Pending For Part Report',
      section: 'Pending',
      dateRange: { from: 'All Time', to: 'Current' },
      totalCount: data.length,
      columns,
      data,
    };
  }

  // 3. Register Call (Date range filtered)
  static async getRegisteredCalls(fromDate?: string, toDate?: string): Promise<IReportResponse> {
    await connectDB();
    const { from, to } = this.parseDateRange(fromDate, toDate);

    const calls = await ServiceCall.find({
      createdAt: { $gte: from, $lte: to },
    }).sort({ createdAt: -1 });

    const columns = [
      { key: 'callNo', label: 'Call Number' },
      { key: 'regDate', label: 'Registration Date' },
      { key: 'clientName', label: 'Client' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'customerMobile', label: 'Contact Number' },
      { key: 'categoryName', label: 'Product Category' },
      { key: 'productName', label: 'Product' },
      { key: 'modelNo', label: 'Model Number' },
      { key: 'serialNo', label: 'Serial Number' },
      { key: 'symptomName', label: 'Symptom' },
      { key: 'causeName', label: 'Cause' },
      { key: 'analysisName', label: 'Analysis' },
      { key: 'technicianName', label: 'Assigned Engineer' },
      { key: 'callStatus', label: 'Call Status' },
    ];

    const data = calls.map((c) => ({
      callNo: c.callNo,
      regDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      clientName: c.clientName,
      customerName: c.customerName,
      customerMobile: c.customerMobile,
      categoryName: c.categoryName,
      productName: c.productName || `${c.brandName} ${c.categoryName}`,
      modelNo: c.modelNo || 'N/A',
      serialNo: c.serialNo || 'N/A',
      symptomName: c.symptomName || c.reportedFault,
      causeName: c.causeName || 'Under Investigation',
      analysisName: c.analysisName || 'Awaiting Field Inspection',
      technicianName: c.technicianName || 'Unassigned',
      callStatus: c.callStatus,
    }));

    return {
      reportKey: 'registeredCalls',
      title: 'Registered Call Report',
      section: 'Other',
      dateRange: { from: fromDate || 'Beginning', to: toDate || 'Present' },
      totalCount: data.length,
      columns,
      data,
    };
  }

  // 4. Completed Call
  static async getCompletedCalls(fromDate?: string, toDate?: string): Promise<IReportResponse> {
    await connectDB();
    const { from, to } = this.parseDateRange(fromDate, toDate);

    const calls = await ServiceCall.find({
      callStatus: 'COMPLETED',
      $or: [
        { completedDate: { $gte: from, $lte: to } },
        { updatedAt: { $gte: from, $lte: to } },
      ],
    }).sort({ completedDate: -1, updatedAt: -1 });

    const columns = [
      { key: 'callNo', label: 'Call Number' },
      { key: 'regDate', label: 'Registration Date' },
      { key: 'completedDate', label: 'Completion Date' },
      { key: 'clientName', label: 'Client' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'productName', label: 'Product' },
      { key: 'modelNo', label: 'Model Number' },
      { key: 'serialNo', label: 'Serial Number' },
      { key: 'technicianName', label: 'Assigned Engineer' },
      { key: 'serviceRemarks', label: 'Service Remarks' },
      { key: 'sparePartsUsed', label: 'Spare Parts Used' },
      { key: 'callStatus', label: 'Call Status' },
    ];

    const data = calls.map((c) => ({
      callNo: c.callNo,
      regDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      completedDate: c.completedDate
        ? new Date(c.completedDate).toLocaleDateString()
        : new Date(c.updatedAt).toLocaleDateString(),
      clientName: c.clientName,
      customerName: c.customerName,
      productName: c.productName || `${c.brandName} ${c.categoryName}`,
      modelNo: c.modelNo || 'N/A',
      serialNo: c.serialNo || 'N/A',
      technicianName: c.technicianName || 'Assigned Technician',
      serviceRemarks: c.serviceRemarks || 'Job completed successfully and tested.',
      sparePartsUsed: c.sparePartsUsed || 'None',
      callStatus: c.callStatus,
    }));

    return {
      reportKey: 'completedCalls',
      title: 'Completed Call Report',
      section: 'Other',
      dateRange: { from: fromDate || 'Beginning', to: toDate || 'Present' },
      totalCount: data.length,
      columns,
      data,
    };
  }

  // 5. All Part Demanded
  static async getAllPartDemanded(fromDate?: string, toDate?: string): Promise<IReportResponse> {
    await connectDB();
    const { from, to } = this.parseDateRange(fromDate, toDate);

    const demands = await PartDemand.find({
      demandDate: { $gte: from, $lte: to },
    }).sort({ demandDate: -1 });

    const columns = [
      { key: 'callNo', label: 'Call Number' },
      { key: 'demandDate', label: 'Demand Date' },
      { key: 'clientName', label: 'Client' },
      { key: 'productName', label: 'Product' },
      { key: 'modelNo', label: 'Model Number' },
      { key: 'spareName', label: 'Spare Name' },
      { key: 'partCode', label: 'Part Code' },
      { key: 'quantityDemanded', label: 'Quantity Demanded' },
      { key: 'quantityApproved', label: 'Quantity Approved' },
      { key: 'quantityIssued', label: 'Quantity Issued' },
      { key: 'outstandingQuantity', label: 'Outstanding Quantity' },
      { key: 'demandStatus', label: 'Demand Status' },
    ];

    const data = demands.map((d) => ({
      callNo: d.callNo,
      demandDate: new Date(d.demandDate).toLocaleDateString(),
      clientName: d.clientName,
      productName: d.productName,
      modelNo: d.modelNo,
      spareName: d.spareName,
      partCode: d.partCode,
      quantityDemanded: d.quantityDemanded,
      quantityApproved: d.quantityApproved,
      quantityIssued: d.quantityIssued,
      outstandingQuantity: d.outstandingQuantity,
      demandStatus: d.demandStatus,
    }));

    return {
      reportKey: 'allPartDemanded',
      title: 'All Part Demanded Report',
      section: 'Other',
      dateRange: { from: fromDate || 'Beginning', to: toDate || 'Present' },
      totalCount: data.length,
      columns,
      data,
    };
  }

  // 6. Part Consumption
  static async getPartConsumption(fromDate?: string, toDate?: string): Promise<IReportResponse> {
    await connectDB();
    const { from, to } = this.parseDateRange(fromDate, toDate);

    const consumptions = await PartConsumption.find({
      consumptionDate: { $gte: from, $lte: to },
    }).sort({ consumptionDate: -1 });

    const columns = [
      { key: 'consumptionId', label: 'Consumption ID' },
      { key: 'consumptionDate', label: 'Consumption Date' },
      { key: 'callNo', label: 'Call Number' },
      { key: 'clientName', label: 'Client' },
      { key: 'productName', label: 'Product' },
      { key: 'modelNo', label: 'Model Number' },
      { key: 'spareName', label: 'Spare Name' },
      { key: 'partCode', label: 'Part Code' },
      { key: 'quantityConsumed', label: 'Quantity Consumed' },
      { key: 'stockLocation', label: 'Warehouse / Stock Location' },
      { key: 'engineer', label: 'Engineer' },
      { key: 'transactionReference', label: 'Transaction Reference' },
    ];

    const data = consumptions.map((c) => ({
      consumptionId: c.consumptionId,
      consumptionDate: new Date(c.consumptionDate).toLocaleDateString(),
      callNo: c.callNo,
      clientName: c.clientName,
      productName: c.productName,
      modelNo: c.modelNo,
      spareName: c.spareName,
      partCode: c.partCode,
      quantityConsumed: c.quantityConsumed,
      stockLocation: c.stockLocation,
      engineer: c.engineer,
      transactionReference: c.transactionReference || 'TXN-STOCK-OUT',
    }));

    return {
      reportKey: 'partConsumption',
      title: 'Part Consumption Report',
      section: 'Other',
      dateRange: { from: fromDate || 'Beginning', to: toDate || 'Present' },
      totalCount: data.length,
      columns,
      data,
    };
  }

  // 7. PO Raised Report
  static async getPoRaisedReport(fromDate?: string, toDate?: string): Promise<IReportResponse> {
    await connectDB();
    const { from, to } = this.parseDateRange(fromDate, toDate);

    const pos = await PurchaseOrder.find({
      poDate: { $gte: from, $lte: to },
    }).sort({ poDate: -1 });

    const columns = [
      { key: 'poNumber', label: 'PO Number' },
      { key: 'poDate', label: 'PO Date' },
      { key: 'vendorName', label: 'Vendor Name' },
      { key: 'vendorType', label: 'Vendor Type' },
      { key: 'clientName', label: 'Client' },
      { key: 'spareName', label: 'Spare Part' },
      { key: 'partCode', label: 'Part Code' },
      { key: 'quantityOrdered', label: 'Quantity Ordered' },
      { key: 'unitPrice', label: 'Unit Price' },
      { key: 'totalAmount', label: 'Total Amount' },
      { key: 'expectedDeliveryDate', label: 'Expected Delivery Date' },
      { key: 'poStatus', label: 'PO Status' },
    ];

    const data = pos.map((p) => ({
      poNumber: p.poNumber,
      poDate: new Date(p.poDate).toLocaleDateString(),
      vendorName: p.vendorName,
      vendorType: p.vendorType,
      clientName: p.clientName,
      spareName: p.spareName,
      partCode: p.partCode,
      quantityOrdered: p.quantityOrdered,
      unitPrice: `₹${p.unitPrice.toLocaleString()}`,
      totalAmount: `₹${p.totalAmount.toLocaleString()}`,
      expectedDeliveryDate: p.expectedDeliveryDate
        ? new Date(p.expectedDeliveryDate).toLocaleDateString()
        : 'Pending Confirmation',
      poStatus: p.poStatus,
    }));

    return {
      reportKey: 'poRaised',
      title: 'PO Raised Report',
      section: 'Other',
      dateRange: { from: fromDate || 'Beginning', to: toDate || 'Present' },
      totalCount: data.length,
      columns,
      data,
    };
  }

  // 8. Replacement Call Report
  static async getReplacementCallReport(fromDate?: string, toDate?: string): Promise<IReportResponse> {
    await connectDB();
    const { from, to } = this.parseDateRange(fromDate, toDate);

    const calls = await ServiceCall.find({
      'replacementDetails.replacementType': { $exists: true, $ne: '' },
      createdAt: { $gte: from, $lte: to },
    }).sort({ createdAt: -1 });

    const columns = [
      { key: 'callNo', label: 'Call Number' },
      { key: 'regDate', label: 'Registration Date' },
      { key: 'replacementDate', label: 'Replacement Date' },
      { key: 'clientName', label: 'Client' },
      { key: 'customerName', label: 'Customer' },
      { key: 'productName', label: 'Product' },
      { key: 'modelNo', label: 'Model Number' },
      { key: 'serialNo', label: 'Serial Number' },
      { key: 'replacementType', label: 'Replacement Type' },
      { key: 'oldPartDetails', label: 'Old Part/Product Details' },
      { key: 'newPartDetails', label: 'New Part/Product Details' },
      { key: 'replacementReason', label: 'Replacement Reason' },
      { key: 'engineer', label: 'Engineer' },
      { key: 'callStatus', label: 'Status' },
    ];

    const data = calls.map((c) => ({
      callNo: c.callNo,
      regDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      replacementDate: c.replacementDetails?.replacementDate
        ? new Date(c.replacementDetails.replacementDate).toLocaleDateString()
        : new Date(c.updatedAt).toLocaleDateString(),
      clientName: c.clientName,
      customerName: c.customerName,
      productName: c.productName || `${c.brandName} ${c.categoryName}`,
      modelNo: c.modelNo || 'N/A',
      serialNo: c.serialNo || 'N/A',
      replacementType: c.replacementDetails?.replacementType || 'Product / Major Assembly Replacement',
      oldPartDetails: c.replacementDetails?.oldPartOrProduct || 'Defective Module',
      newPartDetails: c.replacementDetails?.newPartOrProduct || 'Brand New OEM Module',
      replacementReason: c.replacementDetails?.replacementReason || 'Unrepairable component failure',
      engineer: c.technicianName || 'Assigned Engineer',
      callStatus: c.callStatus,
    }));

    return {
      reportKey: 'replacementCalls',
      title: 'Replacement Call Report',
      section: 'Other',
      dateRange: { from: fromDate || 'Beginning', to: toDate || 'Present' },
      totalCount: data.length,
      columns,
      data,
    };
  }

  // 9. Cancel Call Report
  static async getCancelledCalls(fromDate?: string, toDate?: string): Promise<IReportResponse> {
    await connectDB();
    const { from, to } = this.parseDateRange(fromDate, toDate);

    const calls = await ServiceCall.find({
      callStatus: 'CANCEL',
      $or: [
        { cancelledDate: { $gte: from, $lte: to } },
        { createdAt: { $gte: from, $lte: to } },
      ],
    }).sort({ cancelledDate: -1, createdAt: -1 });

    const columns = [
      { key: 'callNo', label: 'Call Number' },
      { key: 'regDate', label: 'Registration Date' },
      { key: 'cancelDate', label: 'Cancellation Date' },
      { key: 'clientName', label: 'Client' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'customerMobile', label: 'Contact Number' },
      { key: 'productName', label: 'Product' },
      { key: 'modelNo', label: 'Model Number' },
      { key: 'cancelReason', label: 'Cancellation Reason' },
      { key: 'cancelledBy', label: 'Cancelled By' },
      { key: 'callStatus', label: 'Status' },
    ];

    const data = calls.map((c) => ({
      callNo: c.callNo,
      regDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      cancelDate: c.cancelledDate
        ? new Date(c.cancelledDate).toLocaleDateString()
        : new Date(c.updatedAt).toLocaleDateString(),
      clientName: c.clientName,
      customerName: c.customerName,
      customerMobile: c.customerMobile,
      productName: c.productName || `${c.brandName} ${c.categoryName}`,
      modelNo: c.modelNo || 'N/A',
      cancelReason: c.cancellationReason || 'Customer requested service cancellation',
      cancelledBy: c.cancelledBy || 'Customer / ASC Desk',
      callStatus: c.callStatus,
    }));

    return {
      reportKey: 'cancelledCalls',
      title: 'Cancel Call Report',
      section: 'Other',
      dateRange: { from: fromDate || 'Beginning', to: toDate || 'Present' },
      totalCount: data.length,
      columns,
      data,
    };
  }

  // 10. Writax Product Report
  static async getWritaxProductReport(fromDate?: string, toDate?: string): Promise<IReportResponse> {
    await connectDB();
    const { from, to } = this.parseDateRange(fromDate, toDate);

    const calls = await ServiceCall.find({
      $or: [
        { brandName: { $regex: /writax/i } },
        { clientName: { $regex: /writax/i } },
        { productName: { $regex: /writax/i } },
      ],
      createdAt: { $gte: from, $lte: to },
    }).sort({ createdAt: -1 });

    const columns = [
      { key: 'callNo', label: 'Call Number' },
      { key: 'regDate', label: 'Registration Date' },
      { key: 'clientName', label: 'Client' },
      { key: 'brandName', label: 'Brand' },
      { key: 'productName', label: 'Product Name' },
      { key: 'modelNo', label: 'Model Number' },
      { key: 'serialNo', label: 'Serial Number' },
      { key: 'reportedFault', label: 'Reported Issue' },
      { key: 'technicianName', label: 'Engineer' },
      { key: 'callStatus', label: 'Status' },
    ];

    const data = calls.map((c) => ({
      callNo: c.callNo,
      regDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      clientName: c.clientName,
      brandName: c.brandName,
      productName: c.productName || 'Writax Commercial Smart System',
      modelNo: c.modelNo || 'WRTX-500-HD',
      serialNo: c.serialNo || 'N/A',
      reportedFault: c.reportedFault,
      technicianName: c.technicianName || 'Assigned Tech',
      callStatus: c.callStatus,
    }));

    return {
      reportKey: 'writaxProducts',
      title: 'Writax Product Report',
      section: 'Other',
      dateRange: { from: fromDate || 'Beginning', to: toDate || 'Present' },
      totalCount: data.length,
      columns,
      data,
    };
  }

  // 11. Defective to Be Return
  static async getDefectiveToBeReturn(fromDate?: string, toDate?: string): Promise<IReportResponse> {
    await connectDB();
    const { from, to } = this.parseDateRange(fromDate, toDate);

    const returns = await DefectiveReturn.find({
      returnDate: { $gte: from, $lte: to },
    }).sort({ returnDate: -1 });

    const columns = [
      { key: 'returnReference', label: 'Return Reference' },
      { key: 'callNo', label: 'Call Number' },
      { key: 'returnDate', label: 'Return Date' },
      { key: 'clientName', label: 'Client' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'productName', label: 'Product' },
      { key: 'modelNo', label: 'Model Number' },
      { key: 'spareName', label: 'Spare Name' },
      { key: 'partCode', label: 'Part Code' },
      { key: 'defectiveQuantity', label: 'Defective Quantity' },
      { key: 'returnReason', label: 'Return Reason' },
      { key: 'returnStatus', label: 'Return Status' },
    ];

    const data = returns.map((r) => ({
      returnReference: r.returnReference,
      callNo: r.callNo,
      returnDate: new Date(r.returnDate).toLocaleDateString(),
      clientName: r.clientName,
      vendorName: r.vendorName,
      productName: r.productName,
      modelNo: r.modelNo,
      spareName: r.spareName,
      partCode: r.partCode,
      defectiveQuantity: r.defectiveQuantity,
      returnReason: r.returnReason,
      returnStatus: r.returnStatus,
    }));

    return {
      reportKey: 'defectiveToReturn',
      title: 'Defective to Be Return Report',
      section: 'Other',
      dateRange: { from: fromDate || 'Beginning', to: toDate || 'Present' },
      totalCount: data.length,
      columns,
      data,
    };
  }

  // 12. SF Stock Report
  static async getSfStockReport(): Promise<IReportResponse> {
    await connectDB();
    const items = await StockInventory.find({ status: 'A' }).sort({ productName: 1 });

    const columns = [
      { key: 'productName', label: 'Product' },
      { key: 'modelNo', label: 'Model Number' },
      { key: 'spareName', label: 'Spare Name' },
      { key: 'partCode', label: 'Part Code' },
      { key: 'availableQuantity', label: 'Available Quantity' },
      { key: 'reservedQuantity', label: 'Reserved Quantity' },
      { key: 'issuedQuantity', label: 'Issued Quantity' },
      { key: 'stockLocation', label: 'Stock Location' },
    ];

    const data = items.map((i) => ({
      productName: i.productName,
      modelNo: i.modelNo,
      spareName: i.spareName,
      partCode: i.partCode,
      availableQuantity: i.availableQuantity,
      reservedQuantity: i.reservedQuantity,
      issuedQuantity: i.issuedQuantity,
      stockLocation: i.stockLocation,
    }));

    return {
      reportKey: 'sfStock',
      title: 'SF Stock Report',
      section: 'Other',
      dateRange: { from: 'Current Stock', to: 'Live Warehouse' },
      totalCount: data.length,
      columns,
      data,
    };
  }
}
