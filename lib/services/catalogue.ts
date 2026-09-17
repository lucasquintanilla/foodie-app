import type { ServiceIntakeSchema, ServiceItem } from "@/types"

export const TEMPORARY_CATALOGUE = true

const cleaningQuestions: ServiceIntakeSchema = [
  { id: "property_type", label: "Property type", type: "select", required: true, options: ["Apartment", "House", "Office", "Other"] },
  { id: "rooms", label: "How many rooms or areas need attention?", type: "number", required: true, placeholder: "For example, 4" },
  { id: "items", label: "Anything specific to include?", type: "textarea", required: false, placeholder: "Windows, appliances, upholstery…" },
]

const repairQuestions: ServiceIntakeSchema = [
  { id: "problem", label: "Describe the problem", type: "textarea", required: true, placeholder: "What is happening and when did it start?" },
  { id: "fixture", label: "Fixture, appliance or area", type: "text", required: true, placeholder: "For example, kitchen sink" },
  { id: "materials", label: "Are replacement materials already available?", type: "select", required: true, options: ["Yes", "No", "Not sure"] },
]

const paintingQuestions: ServiceIntakeSchema = [
  { id: "area", label: "What area needs painting?", type: "text", required: true, placeholder: "Room, walls, exterior or furniture" },
  { id: "size", label: "Approximate size", type: "text", required: true, placeholder: "Measurements or number of rooms" },
  { id: "condition", label: "Current surface condition", type: "select", required: true, options: ["Good", "Minor preparation needed", "Damaged or peeling", "Not sure"] },
]

const laundryQuestions: ServiceIntakeSchema = [
  { id: "quantity", label: "Approximate quantity", type: "text", required: true, placeholder: "Bags, loads or number of items" },
  { id: "ironing", label: "Is ironing required?", type: "select", required: true, options: ["Yes", "No", "Only some items"] },
]

function schemaFor(name: string, category: string): ServiceIntakeSchema {
  if (name.toLowerCase().includes("painting")) return paintingQuestions
  if (category === "Cleaning") return cleaningQuestions
  if (category === "Laundry") return laundryQuestions
  return repairQuestions
}

function service(
  id: string,
  slug: string,
  name: string,
  baseEstimateCents: number,
  imageUrl: string,
  category: string,
  description: string,
  isAddOn = false,
): ServiceItem {
  return {
    id,
    slug,
    name,
    description,
    category,
    imageUrl,
    baseEstimateCents,
    currency: "EUR",
    isActive: true,
    isAddOn,
    intakeSchema: schemaFor(name, category),
  }
}

export const FALLBACK_SERVICES: ServiceItem[] = [
  service("ea387b0c-0289-4065-a4e1-93276e425fc4", "house-cleaning-free-windows", "House cleaning + free windows", 6490, "https://storage.googleapis.com/oscar-storage/task_photo/deep_house_clean_.jpeg", "Cleaning", "Book a home cleaning and get a free window cleaning. The perfect combination to have everything cleaned at once."),
  service("a36715ca-c2c3-4496-a404-ca9342ca7e0c", "replace-bathroom-faucet", "Replace bathroom faucet (Energy efficiency)", 3950, "https://storage.googleapis.com/oscar-storage/task_photo/Replace_bath_faucet_Large.jpeg", "Energy efficiency", "Professional replacement of energy-efficient bathroom faucets, reducing water usage and costs."),
  service("79f3ecf0-8118-44e0-a600-238fd1cc7416", "window-cleaning", "Window cleaning", 2490, "https://storage.googleapis.com/oscar-storage/task_photo/window_cleaning_.jpeg", "Cleaning", "Dirty windows? Leave the window and frame cleaning to us."),
  service("3fb78afc-a097-48bd-8416-5cb9fab3272d", "install-shower-cabin", "Install shower cabin", 15950, "https://storage.googleapis.com/oscar-storage/task_photo/install_shower_cabin_800.jpeg", "Installation", "Expert installation of shower cabins, modernizing your bathroom with style and functionality."),
  service("34ffff3e-4485-45ea-871d-5ac1c055eff8", "wash-dry-fold", "Wash, dry and fold clothes at home", 1050, "https://storage.googleapis.com/oscar-storage/task_photo/wash_dry_fold_clothes_at_home.jpeg", "Laundry", "Clothes washed, dried and folded in the comfort of your home. Practical, convenient and hassle-free."),
  service("6fbd5d23-dd08-4e72-a1fd-4f280643c2c1", "repair-shower-cabin", "Repair shower cabin (Water leak)", 21250, "https://storage.googleapis.com/oscar-storage/task_photo/repair_shower_cabin_800.jpeg", "Repair", "Reliable repair for shower cabins, fixing water leaks and restoring a watertight seal."),
  service("060b2de2-04d0-4380-9499-90cd80309929", "replace-shower", "Replace shower (Energy efficiency)", 3890, "https://storage.googleapis.com/oscar-storage/task_photo/replace_shower_cabin_800.jpeg", "Energy efficiency", "Upgrade to an energy-efficient shower, saving water while maintaining comfort and style."),
  service("124ac708-679f-48fb-a7b1-b2bde035a8dd", "replace-shower-column", "Replace shower column", 4790, "https://storage.googleapis.com/oscar-storage/task_photo/replace_shower_column_800.jpeg", "Maintenance", "Efficient replacement of shower columns, ensuring optimal water flow and a sleek finish."),
  service("8324eea8-225b-4263-82ef-0042f5559de4", "house-cleaning", "House cleaning", 2990, "https://storage.googleapis.com/oscar-storage/task_photo/house_cleaning.jpeg", "Cleaning", "Home needs cleaning? We take care of everything: clean floors, made beds and dusted furniture."),
  service("55acbf74-7eb2-4dc9-9297-9a7f62103e81", "repair-intercom", "Repair intercom", 5850, "https://storage.googleapis.com/oscar-storage/task_photo/repair_intercom_800.jpeg", "Repair", "Expert repair for intercom systems, ensuring clear communication and dependable operation."),
  service("44aaa459-bf5d-4654-8f59-08b83722382c", "replace-sink-faucet", "Replace sink faucet (Energy efficiency)", 4350, "https://storage.googleapis.com/oscar-storage/task_photo/replace_sink_faucet_energy_efficiency.jpeg", "Energy efficiency", "Professional replacement of energy-efficient sink faucets, combining sustainability and elegance."),
  service("d12f97b5-bff7-4c29-a8d2-a7e2189b20b8", "raise-door", "Raise door", 5490, "https://storage.googleapis.com/oscar-storage/task_photo/fix_door_heigth_800.jpeg", "Homefix", "Adjust a door so it opens and closes smoothly."),
  service("86bc38be-af8d-44d0-babb-6c83d4bf9f7f", "tile-laying", "Tile laying", 11990, "https://storage.googleapis.com/oscar-storage/task_photo/install_tiles_800.jpeg", "Homefix", "Refresh kitchens, bathrooms, walls or floors with professionally laid tiles."),
  service("ab74450b-3151-4db5-9b56-f1d66a03c7e7", "unclog-sink", "Unclog sink", 8350, "https://storage.googleapis.com/oscar-storage/task_photo/unclog_sink.jpeg", "Repair", "We diagnose and unblock clogged sinks so everything works properly again."),
  service("6cd5dbaf-a1b0-4b0d-9ae6-3c6555f9d414", "deep-house-cleaning", "Deep house cleaning", 7990, "https://storage.googleapis.com/oscar-storage/task_photo/deep_house_clean_.jpeg", "Cleaning", "A more thorough clean that can include windows, appliances, doors and other agreed areas."),
  service("399cb746-8c52-43b5-adb9-59fc32e0de57", "replace-mailbox-lock", "Replace mailbox lock", 2990, "https://storage.googleapis.com/oscar-storage/task_photo/replace_mailbox_lock.jpeg", "Repair", "Replace a mailbox lock to restore secure access to your post."),
  service("46fc9dd5-61c1-4e5b-ab19-6be723f2dace", "repair-boiler", "Repair boiler", 6350, "https://storage.googleapis.com/oscar-storage/task_photo/repair_boiler.jpeg", "Repair", "Initial boiler assessment and repair service, subject to diagnosis and parts."),
  service("c9cd04c7-43ad-481b-87e7-d8abf8b81a9d", "interior-drawers-cleaning", "Interior drawers cleaning", 450, "https://storage.googleapis.com/oscar-storage/task_photo/interior_drawers_cleaning.jpeg", "Cleaning", "Add interior drawer cleaning to another cleaning service.", true),
  service("55cfc4c3-7edb-449e-b861-8bbcf0ad3416", "mattress-cleaning", "Mattress cleaning", 4490, "https://storage.googleapis.com/oscar-storage/task_photo/mattress_cleaning_.jpeg", "Cleaning", "Mattress cleaning and sanitisation using extraction and suction equipment."),
  service("781efc6a-a833-42a4-9733-5d6cd4bcd797", "sofa-cleaning", "Sofa cleaning", 3990, "https://storage.googleapis.com/oscar-storage/task_photo/sofa_cleaning_.jpeg", "Cleaning", "Sofa cleaning and sanitisation using extraction and suction equipment."),
  service("9a91edbd-659b-4fe4-8c7e-878b4ea1e3cb", "rug-cleaning", "Rug cleaning", 5690, "https://storage.googleapis.com/oscar-storage/task_photo/rug_cleaning_.jpeg", "Cleaning", "Rug cleaning and sanitisation using extraction and suction equipment."),
  service("c8c2907b-7f96-4308-84c6-c73f4f828cd6", "room-cleaning", "Room cleaning", 1050, "https://storage.googleapis.com/oscar-storage/task_photo/clean_room.jpeg", "Cleaning", "Focused room cleaning to keep a personal space tidy and inviting."),
  service("52918b7b-ef0b-4473-b570-0b50f50529fb", "wash-dry-iron", "Wash, dry and iron clothes at home", 3490, "https://storage.googleapis.com/oscar-storage/task_photo/wash_dry_iron_clothes_at_home.jpeg", "Laundry", "Clothes washed, dried and ironed in your home, subject to the agreed quantity."),
  service("5f08d944-0e9d-4d2e-b9cb-96cd0b9e374b", "exterior-painting", "Exterior painting", 21150, "https://storage.googleapis.com/oscar-storage/task_photo/exterior_painting.jpeg", "Homefix", "Exterior painting with the final scope and materials confirmed after review."),
  service("59c9634b-ee17-4ce1-831e-f8b5abaccbd0", "furniture-painting", "Furniture painting", 15890, "https://storage.googleapis.com/oscar-storage/task_photo/furniture_painting.jpeg", "Decoration", "Refresh furniture with a professional painted finish."),
  service("e08df49b-4b23-4cd2-8819-a1d576082b52", "kitchen-cleaning", "Kitchen cleaning", 1550, "https://storage.googleapis.com/oscar-storage/task_photo/clean_kitchen_.jpeg", "Cleaning", "Focused kitchen cleaning based on the areas and items agreed in advance."),
  service("da27f883-e9c5-42d7-9748-195068634708", "interior-painting", "Interior painting", 7150, "https://storage.googleapis.com/oscar-storage/task_photo/wall_paint_wall.jpeg", "Homefix", "Interior painting with preparation, materials and final scope confirmed after review."),
]
