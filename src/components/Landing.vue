<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import Swal from "sweetalert2";
import ProvinceData from "./province";
import { useRoute } from "vue-router";

const router = useRoute();
const p_province = ref((router.params.id as string ?? "").toLowerCase());
console.log('000000', p_province.value);

watch(
  () => router.params,
  (newParams) => {
    p_province.value = Array.isArray(newParams.id) ? newParams.id[0] : newParams.id;
  }
);

console.log("p_province", p_province);

interface IProvince {
  name_en: string;
  id: number;
  name_th: string;
  geography_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: boolean;
}

const dataProvince = reactive<{ data: IProvince[] }>({
  data: [],
});

const normalizedProvinceData = ProvinceData.map((province) => {
  const name_en_normalized = province.name_en
    .replace(/\s+/g, '')
    .toLowerCase();
  const normalizedProvince: IProvince = {
    ...province,
    name_en: name_en_normalized,
  };
  dataProvince.data.push(normalizedProvince);
  return normalizedProvince;
});

onMounted(() => {
  normalizedProvinceData;
});

const chatGPT_apiKry =
  "key";

let map: google.maps.Map;
let autocomplete: google.maps.places.Autocomplete;
let directionsService: google.maps.DirectionsService;
let directionsRenderer: google.maps.DirectionsRenderer;
const markers = ref<google.maps.Marker[]>([]);

async function initMap(): Promise<void> {
  const position = { lat: 13.7563, lng: 100.5018 };

  const { Map } = (await google.maps.importLibrary(
    "maps"
  )) as google.maps.MapsLibrary;
  const { AdvancedMarkerElement } = (await google.maps.importLibrary(
    "marker"
  )) as google.maps.MarkerLibrary;
  const { Autocomplete } = (await google.maps.importLibrary(
    "places"
  )) as google.maps.PlacesLibrary;

  map = new Map(document.getElementById("map") as HTMLElement, {
    zoom: 4,
    center: position,
    mapId: "DEMO_MAP_ID",
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);

  // const marker = new AdvancedMarkerElement({
  //   map: map,
  //   position: position,
  //   title: "Current Location",
  // });

  const input = document.getElementById("pac-input") as HTMLInputElement;
  autocomplete = new Autocomplete(input);
  autocomplete.bindTo("bounds", map);

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
      console.log("No details available for input: '" + place.name + "'");
      return;
    }
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }
    marker.setPosition(place.geometry.location);
    marker.setTitle(place.name || "");
  });
}

onMounted(() => {
  initMap();
});

interface ILocation {
  time: string;
  location_name: string;
  location_detail: string;
}

const province = ref(p_province.value || "");
const start_date = ref("08:00");
const end_date = ref("16:00");
const numDay = ref("1");
const data_return = ref<any>(null);
const show_loading = ref(false);

function createMarker(place) {
  const marker = new google.maps.Marker({
    map,
    position: place.geometry.location,
    title: place.name,
  });
  // console.log('marker',marker);

  markers.value.push(marker);

  marker.addListener("click", () => {
    map.setZoom(15);
    map.panTo(marker.getPosition());
  });

  // if (markers.value.length > 1) {
  //   calculateAndDisplayRoute();
  // }
}

// function calculateAndDisplayRoute() {
//   if (markers.value.length < 2) return;

//   const waypoints = markers.value.slice(1, -1).map((marker, index) => {
//     return {
//       location: marker.getPosition() as google.maps.LatLng,
//       stopover: true,
//     };
//   });

//   directionsService.route(
//     {
//       origin: markers.value[0].getPosition() as google.maps.LatLng,
//       destination: markers.value[markers.value.length - 1].getPosition() as google.maps.LatLng,
//       waypoints: waypoints,
//       travelMode: google.maps.TravelMode.DRIVING,
//       optimizeWaypoints: true,
//     },
//     (response, status) => {
//       if (status === google.maps.DirectionsStatus.OK) {
//         directionsRenderer.setDirections(response);
//         console.log('Route calculated successfully:', response);
//       } else {
//         console.log('Directions request failed due to ' + status);
//       }
//     }
//   );
// }

const ssssss = ref("");
let naw_Map_result = [];

const processInput = (
  province: string,
  start_date: string,
  end_date: string,
  numDay: string
) => {
  const Map_result = ref([]);

  const request = {
    query: `attractions in ${province} province`,
    fields: ["name", "geometry", "formatted_address"],
  };
  console.log("request", request);

  const service = new google.maps.places.PlacesService(map);
  service.textSearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      Map_result.value = results;

      let check_nym_day = 0;
      if (numDay == "1") {
        check_nym_day = 4;
      }
      if (numDay == "2") {
        check_nym_day = 7;
      }
      if (numDay == "3") {
        check_nym_day = 10;
      }
      if (parseInt(numDay) > 3) {
        check_nym_day = 15;
      }

      for (let i = 0; i < check_nym_day; i++) {
        naw_Map_result.push(Map_result.value[i].name);
      }

      for (let i = 0; i < check_nym_day; i++) {
        //results.length
        createMarker(results[i]);
      }

      console.log("naw_Map_result", naw_Map_result);
      ssssss.value = naw_Map_result.join("| ");

      console.log(
        "ข้อมูลที่ท่องเที่ยวจาก googolr map (String) ::::: ",
        ssssss.value
      );

      const url = "https://api.openai.com/v1/chat/completions";
      const payload = {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Explore the enchanting tourist attractions as follows: ${ssssss.value}. Make sure to visit each and every destination mentioned. spanning from ${start_date} to ${end_date}, totaling ${numDay} days. Each destination has been carefully curated to create a seamless itinerary, thoughtfully arranged by time. Dive into this detailed plan, where all the essential information is elegantly presented in Thai, ensuring you have a memorable experience.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      };

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + chatGPT_apiKry,
        },
        body: JSON.stringify(payload),
      };

      fetch(url, options)
        .then((response) => response.json())
        .then((data) => {
          const output_txt = data.choices[0].message.content;
          data_return.value = output_txt;
          console.log(data_return.value);
          show_loading.value = false;
          return output_txt;
        })
        .catch((error) => console.error("Error:", error));
    }
  });
};

const callAi = () => {
  if (!province.value || !start_date.value || !end_date.value) {
    Swal.fire({
      title: "กรุณากรอกข้อมูลให้ครบ",
      icon: "warning",
      showCancelButton: false,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "ตกลง",
    });
    return;
  } else {
    data_return.value = null;
    show_loading.value = true;
    processInput(
      province.value,
      start_date.value,
      end_date.value,
      numDay.value
    );
  }
};
</script>

<template>
  <div>
    <div class="m-6">
      <h1
        class="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl"
      >
        สวัสดี {{ province }}
      </h1>
      <p>ยินดีต้อนรับสู่ Ai ช่วยวางแผนการท่องเที่ยว</p>
      <!-- {{ map_new }} -->
      <!-- <p>{{ province }} {{ start_date }} {{ end_date }} {{ numDay }}</p> -->
      <div
        v-if="!data_return && show_loading"
        class="m-8 flex items-center justify-center"
      >
        <div role="status">
          <svg
            aria-hidden="true"
            class="w-4 h-4 me-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span class="sr-only">Loading...</span>
        </div>
        กำลังรอ Ai ประมวลผล
      </div>
      <div
        v-if="data_return"
        class="mt-6 mb-6 text-green-700 whitespace-pre-line"
      >
        {{ data_return }}
      </div>
    </div>

    <div id="map"></div>

    <div class="bg-gray-100 bottom-0 left-0 right-0">
      <div class="p-4 flex-wrap">
        <div>
          <label
            for="small-input"
            class="block mb-2 text-sm font-medium text-gray-900"
            >เลือกจังหวัดที่คุณต้องการ
            <span class="text-red-500">*</span></label
          >
          <select
            v-model="province"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option selected disabled>จังหวัด</option>
            <option
              v-for="(province, index) in dataProvince.data"
              :key="index"
              :value="province.name_en.toLowerCase()"
            >
              {{ province.name_th }}
            </option>
          </select>
        </div>
        <div class="mt-2">
          <div class="mx-auto grid grid-cols-3 gap-4">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-900"
                >เวลาเริ่มต้น <span class="text-red-500">*</span></label
              >
              <div class="relative">
                <div
                  class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none"
                >
                  <svg
                    class="w-4 h-4 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  v-model="start_date"
                  type="time"
                  class="bg-gray-50 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  required
                />
              </div>
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-900"
                >เวลาสิ้นสุด <span class="text-red-500">*</span></label
              >
              <div class="relative">
                <div
                  class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none"
                >
                  <svg
                    class="w-4 h-4 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  v-model="end_date"
                  type="time"
                  class="bg-gray-50 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  required
                />
              </div>
            </div>
            <div>
              <label
                for="small-input"
                class="block mb-2 text-sm font-medium text-gray-900"
                >จำนวนวัน <span class="text-red-500">*</span></label
              >
              <input
                min="1"
                v-model="numDay"
                type="number"
                class="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        <!-- <div class="mt-2">
          <div>
            <label
              for="small-input"
              class="block mb-2 text-sm font-medium text-gray-900"
              >ข้อมูลเพิ่มเติมที่คุณอยากบอก</label
            >
            <input
              v-model="numDay"
              type="text"
              class="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div> -->
        <div class="mt-2 flex justify-center">
          <button
            @click="callAi()"
            class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
          >
            เรียก AI ทันที
          </button>
        </div>
      </div>
    </div>

    <p></p>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
#map {
  height: 400px;
  width: 100%;
}
</style>
