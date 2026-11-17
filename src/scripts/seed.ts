import mongoose from "mongoose";
import { User } from "../models/User";
import { Service } from "../models/Service";
import { Appointment } from "../models/Appointment";
import { ENV } from "../config/env";
import { APPOINTMENT_STATUS, PAYMENT_STATUS, USER_ROLES } from "../constants";

const initialServices = [
  {
    title: "Signature Balayage & Silk Glaze",
    slug: "signature-balayage-silk-glaze",
    category: "Hair",
    description:
      "A hand-painted custom French balayage tailored to your complexion and bone structure, finished with a luminous silk shine glaze and luxury botanical blowout.",
    price: 185,
    durationMinutes: 120,
    images: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    ],
    isActive: true,
    specialists: ["Elena Vance (Master Colorist)", "Chloe Moreau"],
  },
  {
    title: "Precision Editorial Cut & Blowout",
    slug: "precision-editorial-cut-blowout",
    category: "Hair",
    description:
      "A bespoke precision haircut tailored to your hair texture, featuring a scalp detox ritual, customized deep conditioning masque, and signature runway blowout.",
    price: 95,
    durationMinutes: 60,
    images: [
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
    ],
    isActive: true,
    specialists: ["Chloe Moreau", "David Rossi"],
  },
  {
    title: "Russian Gel Manicure & Botanical Spa",
    slug: "russian-gel-manicure-botanical-spa",
    category: "Nails",
    description:
      "Flawless dry e-file cuticle work, structural apex gel reinforcement, nourishing organic rose petal soak, and organic argan oil arm massage.",
    price: 75,
    durationMinutes: 75,
    images: [
      "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
    ],
    isActive: true,
    specialists: ["Mia Lindqvist"],
  },
  {
    title: "Caviar & 24K Gold Youth Radiance Facial",
    slug: "caviar-gold-youth-radiance-facial",
    category: "Facial & Skin",
    description:
      "An opulent anti-aging skincare journey featuring wild French caviar extract, 24K colloidal gold infusion, micro-current lifting, and cryo oxygen therapy.",
    price: 220,
    durationMinutes: 90,
    images: [
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512290900672-1f41d996d926?auto=format&fit=crop&w=800&q=80",
    ],
    isActive: true,
    specialists: ["Dr. Aurelia Chen (Aesthetician)", "Sarah Jenkins"],
  },
  {
    title: "Deep Tissue Aromatherapy Hot Stone Ritual",
    slug: "deep-tissue-aromatherapy-hot-stone-ritual",
    category: "Massage",
    description:
      "Heated basalt stones infused with organic lavender and frankincense essential oils to melt away chronic muscular tension and restore nervous equilibrium.",
    price: 160,
    durationMinutes: 90,
    images: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
    ],
    isActive: true,
    specialists: ["Alexander Wright (RMT)"],
  },
  {
    title: "Royal Bridal Couture Glamour Package",
    slug: "royal-bridal-couture-glamour-package",
    category: "Makeup",
    description:
      "The definitive bridal look featuring high-definition airbrush makeup, couture hair updo, veil positioning, luxury mink lash application, and touch-up kit.",
    price: 320,
    durationMinutes: 150,
    images: [
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
    ],
    isActive: true,
    specialists: ["Victoria Sterling (Bridal Director)"],
  },
  {
    title: "Executive Beard Sculpt & Hot Towel Shave",
    slug: "executive-beard-sculpt-hot-towel-shave",
    category: "Barbering",
    description:
      "Traditional straight razor precision line work, eucalyptus steam towels, sandalwood pre-shave oil massage, and organic cold-pressed beard conditioning balm.",
    price: 65,
    durationMinutes: 45,
    images: [
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    ],
    isActive: true,
    specialists: ["Marco Rossi"],
  },
  {
    title: "Aromatherapy Thermal Spa & Hydro-Detox",
    slug: "aromatherapy-thermal-spa-hydro-detox",
    category: "Spa & Wellness",
    description:
      "A complete hydro-detox experience featuring steam inhalation, mineral-rich thermal salt soak, lymphatic dry brushing, and restorative herbal tea ceremony.",
    price: 150,
    durationMinutes: 90,
    images: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    ],
    isActive: true,
    specialists: ["Camilla Dubois"],
  },
  {
    title: "Gentle Botanical Full Body Waxing",
    slug: "gentle-botanical-full-body-waxing",
    category: "Waxing",
    description:
      "Hypoallergenic organic chamomile hard wax treatment designed for sensitive skin, followed by soothing lavender and tea tree calming serum.",
    price: 110,
    durationMinutes: 60,
    images: [
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80",
    ],
    isActive: true,
    specialists: ["Chloe Moreau"],
  },
];

const seed = async () => {
  try {
    await mongoose.connect(ENV.DATABASE_URL);
    console.log("[Seed] Connected to database.");

    // 1. Seed Administrator
    let admin = await User.findOne({ email: "admin@salonbook.com" });
    if (!admin) {
      admin = await User.create({
        name: "SalonBook Administrator",
        email: "admin@salonbook.com",
        password: "Admin@123456",
        role: USER_ROLES.ADMIN,
        phone: "+1 (555) 019-2834",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      });
      console.log("[Seed] Admin user created: admin@salonbook.com / Admin@123456");
    } else {
      console.log("[Seed] Admin user already exists.");
    }

    // 2. Seed Customer
    let customer = await User.findOne({
      email: "customer@salonbook.com",
    });
    if (!customer) {
      customer = await User.create({
        name: "Sophia Montgomery",
        email: "customer@salonbook.com",
        password: "Customer@123456",
        role: USER_ROLES.CUSTOMER,
        phone: "+1 (555) 018-9922",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
      });
      console.log("[Seed] Demo customer created: customer@salonbook.com / Customer@123456");
    }

    // 3. Seed Services
    for (const serviceData of initialServices) {
      const exists = await Service.findOne({ slug: serviceData.slug });
      if (!exists) {
        await Service.create(serviceData);
      }
    }
    console.log(`[Seed] Services seeded (${initialServices.length} items verified).`);

    // 4. Seed sample appointments if none exist
    const appointmentCount = await Appointment.countDocuments();
    if (appointmentCount === 0 && customer) {
      const services = await Service.find().limit(2);
      if (services.length > 0) {
        // Pending appointment
        await Appointment.create({
          customerId: customer._id,
          serviceId: services[0]._id,
          appointmentDate: new Date(Date.now() + 86400000 * 2), // 2 days later
          timeSlot: "02:00 PM",
          servicePrice: services[0].price,
          paymentStatus: PAYMENT_STATUS.UNPAID,
          status: APPOINTMENT_STATUS.PENDING,
          notes: "First time visit. Looking forward to the ritual.",
        });

        // Confirmed unpaid appointment
        if (services.length > 1) {
          await Appointment.create({
            customerId: customer._id,
            serviceId: services[1]._id,
            appointmentDate: new Date(Date.now() + 86400000 * 5), // 5 days later
            timeSlot: "11:00 AM",
            servicePrice: services[1].price,
            paymentStatus: PAYMENT_STATUS.UNPAID,
            status: APPOINTMENT_STATUS.CONFIRMED,
            notes: "Confirmed by salon. Ready for payment.",
          });
        }
        console.log("[Seed] Sample customer appointments seeded.");
      }
    }

    console.log("[Seed] Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("[Seed Error]:", err);
    process.exit(1);
  }
};

seed();
