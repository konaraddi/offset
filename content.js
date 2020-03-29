let total = {
    expenditure: 0.0,
    carbon: 0.0
  };


// reset
// chrome.storage.sync.set(total, () => {console.log("RESET")})



console.log(`CONTENT SCRIPT LOADED AT ${new Date().toLocaleTimeString()}`);


chrome.storage.sync.get(
  ["expenditure", "carbon"],
  ({expenditure, carbon}) => {
      console.log(`Savedtotal: \$${expenditure} ${carbon}`)
    if (expenditure != null && carbon != null) {
      total.expenditure = parseFloat(expenditure);
      total.carbon = parseFloat(carbon);
      console.log(`Fetched totals from storage: ${JSON.stringify(total)}`);
    }
  }
);

let showModal = () => {
  const url = location.href;
  const isJetcom = url == "https://jet.com/checkout";
  const isAmericanAirlines =
    url.length > 56 &&
    url.substring(0, 56) ==
      "https://www.aa.com/booking/passengers?bookingPathStateId";

  if (!isJetcom && !isAmericanAirlines) {
    return;
  }

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
                  <p id="expense-counter" class="title">$789</p>
                  <p class="heading">donations (USD)</p>
                </div>
              </div>

              <div class="level-item has-text-centered">
                <div>
                  <p id="carbon-counter" class="title">3,456</p>
                  <p class="heading">Tons of Carbon</p>
                </div>
              </div>
            </div>
            <h5 class="subtitle is-5">Offset {{amountToSpend}} tons of carbon to reach your goal!</h5>
            <progress
              id="progress-bar"
              class="progress is-success is-medium"
              :value="progressBarValue"
              :max="goal"
            ></progress>
            <p>Your purchases are set to {{percent}}% of your purchases.</p>
            <p>You can change your percent, goal, and payment method in the extension's settings.</p>
          </section>
          <footer class="modal-card-foot" style="marginTop: 0;">
            <button class="button is-link">Okay</button>
            <button class="button is-link is-light">Cancel</button>
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
      goal: 5,
      isDonating: false,
      donated: false,
      isActive: true,
      progressBarValue: total.carbon
    },
    mounted() {
    
      const countUp1 = new CountUp(
        "carbon-counter",
        total.carbon + this.tons,
        { startVal: total.carbon }
      );
      if (!countUp1.error) {
        countUp1.start();
      } else {
        console.error(countUp1.error);
      }

      const countUp2 = new CountUp(
        "expense-counter",
        total.expenditure + this.money,
        {
          startVal: total.expenditure,
          prefix: "$"
        }
      );
      if (!countUp2.error) {
        countUp2.start();
      } else {
        console.error(countUp2.error);
      }

      
      total.expenditure += parseFloat(this.money);
      total.carbon += parseFloat(this.tons);


      setTimeout(() => (this.progressBarValue = Number(total.carbon)), 250);
      setTimeout(() => (this.isActive = false), 6000);

      chrome.storage.sync.set(total, () => {
        console.log(`Saved ${JSON.stringify(total)} to storage`);
      });
    },
    computed: {
      money() {
        if (isJetcom) {
          let costOfOrder = document
            .getElementsByClassName(
              "base__BaseStyledComponent-sc-1l64hnd-0 typography__Text-sc-1lwzhqv-0 kvuhxc"
            )[12]
            .innerHTML.trim().substring(1);
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
      },
      amountToSpend() {
        return (Number(this.goal) - Number(total.carbon)).toFixed(2)
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
