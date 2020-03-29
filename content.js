function saveData(
  money,
  tons,
  callback = () => {
    console.log(`update storage w/ ${money} and ${tons}`);
  }
) {
  chrome.storage.sync.set({ money, tons }, callback);
}

function getData(
  callback = ({ money, tons }) => {
    console.log(`storage contains ${money} and ${tons}`);
  }
) {
  chrome.storage.sync.get(["money", "tons"], data => callback(data));
}

let showModal = () => {
  console.log(`CONTENT SCRIPT LOADED AT ${new Date().toLocaleTimeString()}`);

  const url = location.href;
  const isJetcom = url == "https://jet.com/checkout";
  const isAmericanAirlines =
    url.length > 56 &&
    url.substring(0, 56) ==
      "https://www.aa.com/booking/passengers?bookingPathStateId";

  /*
    if (!isJetcom && !isAmericanAirlines) {
      return;
    }
    */

  document.body.innerHTML =
    `
    <div><style>
    .progress::-webkit-progress-value {
      transition: width 0.5s ease;
    }
    </style>
      <div id="app">
      <div v-bind:class="['modal modal-fx-fadeInScale', {'is-active': isActive}]">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Thank you!</p>
            <button class="delete" aria-label="close"></button>
          </header>
          <section class="modal-card-body">
            <div class="level is-mobile">
              
              <div class="level-item has-text-centered">
                <div>
                  <p id="counter2" class="title">$789</p>
                  <p class="heading">donations (USD)</p>
                </div>
              </div>

              <div class="level-item has-text-centered">
                <div>
                  <p id="counter1" class="title">3,456</p>
                  <p class="heading">Tonns of Carbon</p>
                </div>
              </div>

            </div>
            <h5 class="subtitle is-5">Offset 10 more tonnes of carbon to reach your goal!</h5>
            <progress
              id="progress-bar"
              class="progress is-success is-medium"
              :value="progressBarValue"
              max="100"
            ></progress>
            <p>Your purchases are set to {{percent}}% of your purchases.</p>
            <p>You can change your percent, goal, and payment method in the extension's settings.</p>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-danger">Cancel</button>
            <button class="button">Learn more</button>
          </footer>
        </div>
      </div>
      </div>
      </div>
      ` + document.body.innerHTML;

  new Vue({
    el: "#app",
    data: {
      percent: 1,
      goal: 100, 
      isDonating: false,
      donated: false,
      isActive: true,
      progressBarValue: 0,
    },
    mounted() {
      const countUp1 = new CountUp("counter1", 5234, { startVal: 2000 });
      if (!countUp1.error) {
        countUp1.start();
      } else {
        console.error(countUp.error);
      }

      const countUp2 = new CountUp("counter2", 7004, { startVal: 2000, prefix: "$" });
      if (!countUp2.error) {
        countUp2.start();
      } else {
        console.error(countUp.error);
      }

      setTimeout(() => this.progressBarValue = 40, 250)

      setTimeout(() => (this.isActive = false), 6000);
    },
    computed: {
      money() {
        if (isJetcom) {
          let costOfOrder = document
            .getElementsByClassName(
              "base__BaseStyledComponent-sc-1l64hnd-0 typography__Text-sc-1lwzhqv-0 kvuhxc"
            )[12]
            .innerHTML.substring(1);
          console.log(costOfOrder);
          return (0.01 * parseFloat(costOfOrder)).toFixed(2);
        }

        if (isAmericanAirlines) {
          let costOfOrder = document
            .getElementsByClassName("costSummary-price-number")[0]
            .innerHTML.trim()
            .substring(1);
          console.log(costOfOrder);
          return (0.01 * parseFloat(costOfOrder)).toFixed(2);
        }
      },
      tons() {
        return (this.money / 3.3).toFixed(2);
      }
    },
    methods: {
      onDonate: function(e) {
        console.log("clicked");
        this.isDonating = true;

        fetch("https://api.cloverly.com/2019-03-beta/purchases/currency", {
          method: "POST",
          headers: {
            Authorization: "Bearer public_key:728042ad434ec585",
            "Content-Type": "application/json"
          },
          body: `{"currency":{"value": ${this.money *
            100},"units":"usd cents"}}`
        }).then(res => {
          console.log(res);
          this.isDonating = false;
          this.donated = true;
        });
      }
    }
  });
};

setTimeout(showModal, 1500);
