
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

const vendorPaymentSchema = z.object({
  vendor_id: z.string().min(1, "Vendor is required"),
  customer_id: z.string().min(1, "Customer is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

type VendorPaymentFormData = z.infer<typeof vendorPaymentSchema>;

export default function LogVendorPaymentForm() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<VendorPaymentFormData>({
    resolver: zodResolver(vendorPaymentSchema),
    defaultValues: {
      vendor_id: "",
      customer_id: "",
      amount: 0,
      payment_date: "",
      notes: "",
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, company_name, vendor_id')
        .eq('status', 'active')
        .order('company_name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name, customer_id')
        .eq('status', 'active')
        .order('company_name');
      
      if (error) throw error;
      return data;
    },
  });

  const createVendorPayment = useMutation({
    mutationFn: async (data: VendorPaymentFormData) => {
      // Use raw SQL to insert into vendor_payments table
      const { error } = await supabase.rpc('insert_vendor_payment', {
        p_vendor_id: data.vendor_id,
        p_customer_id: data.customer_id,
        p_amount: data.amount,
        p_payment_date: data.payment_date,
        p_notes: data.notes || null,
      });
      
      if (error) {
        // Fallback: try direct SQL query
        const { error: directError } = await supabase
          .from('vendor_payments')
          .insert({
            vendor_id: data.vendor_id,
            customer_id: data.customer_id,
            amount: data.amount,
            payment_date: data.payment_date,
            notes: data.notes,
          });
        
        if (directError) throw directError;
      }
    },
    onSuccess: () => {
      toast.success("Vendor payment logged successfully!");
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['vendor-payments'] });
    },
    onError: (error) => {
      toast.error("Failed to log vendor payment");
      console.error('Error logging vendor payment:', error);
    },
  });

  const onSubmit = (data: VendorPaymentFormData) => {
    createVendorPayment.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CreditCard className="h-4 w-4 mr-2" />
          Log Vendor Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Vendor Payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vendor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors?.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.company_name} ({vendor.vendor_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer (Reliever For)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.company_name} ({customer.customer_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createVendorPayment.isPending}>
                {createVendorPayment.isPending ? "Logging..." : "Log Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
