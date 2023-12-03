import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Card, theme } from 'antd';
import React,{useState,useEffect} from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { getDashbordAgents, getDashbordClients, getDashbordProviders, getDashbordRequestVsServices, getDashbordRequests } from './DashboardSlice';


const InfoCard: React.FC<{
  title: string;
  index: number;
  desc: string;
  href: string;
}> = ({ title, href, index, desc }) => {
  const { useToken } = theme;

  const { token } = useToken();


  return (
    <div
      style={{
        backgroundColor: token.colorBgContainer,
        boxShadow: token.boxShadow,
        borderRadius: '8px',
        fontSize: '14px',
        color: token.colorTextSecondary,
        lineHeight: '22px',
        padding: '16px 19px',
        minWidth: '220px',
        flex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            lineHeight: '22px',
            backgroundSize: '100%',
            textAlign: 'center',
            padding: '8px 16px 16px 12px',
            color: '#FFF',
            fontWeight: 'bold',
            backgroundImage:
              "url('https://gw.alipayobjects.com/zos/bmw-prod/daaf8d50-8e6d-4251-905d-676a24ddfa12.svg')",
          }}
        >
          {index}
        </div>
        <div
          style={{
            fontSize: '19px',
            color: token.colorText,
            fontWeight: 'bold',
            paddingBottom: 8,
          }}
        >
          {title}
        </div>
      </div>
      <div
     style={{
      fontSize: '16px',  
      textAlign: 'justify',
      lineHeight: '20px',  
      marginBottom: 8,
    }}
      >
        {desc}
      </div>
      <a href={href} target="_blank" rel="noreferrer">
         View {'>'}
      </a>
    </div>
  );
};

const Welcome: React.FC = () => {
  const { token } = theme.useToken();
  const { initialState } = useModel('@@initialState');
  const [requests,setRequests]=useState([])
  const [clients,setClients]=useState([]);
  const [providers,setProviders]=useState([]);
  const [agents,setAgents]=useState([]);
  const [requestServices,setRequestVsServices]=useState([])



  useEffect(() => {
    async function fetchData() {
      try {
       
        //   console.log('requestVsServicesData',requestVsServicesData);

        const requestsResponse = await getDashbordRequests({ current: 1, pageSize: 10 });
        const requestsData = requestsResponse.data;
        setRequests(requestsData);
  
        // Fetch data for Clients
        const clientsResponse = await getDashbordClients({ current: 1, pageSize: 10 });
        const clientsData = clientsResponse.data;
        setClients(clientsData);
  
        // Fetch data for Providers
        const providersResponse = await getDashbordProviders({ current: 1, pageSize: 10 });
        const providersData = providersResponse.data;
        setProviders(providersData);
  
        // Fetch data for Agents
        const agentsResponse = await getDashbordAgents({ current: 1, pageSize: 10 });
        const agentsData = agentsResponse.data;
        setAgents(agentsData);
  
        // Fetch data for Request vs. Services
        const requestVsServicesResponse = await getDashbordRequestVsServices({ current: 1, pageSize: 10 });
        const requestVsServicesData = requestVsServicesResponse.data;
        setRequestVsServices(requestVsServicesData);

  
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  
    fetchData();
  }, []);
  


  const labels = requestServices?.map((item) => item?.service);
  const dataValues = requestServices?.map((item) => item?.requests);
  
  
  const chartConfig = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Requests',
          data: dataValues,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    },
  };


 

  const options = {
    scales: {
      x: {
        type: 'category',
        labels: labels,
      },
      y: {
        beginAtZero: true,
      },
    },
  };


  Chart.register(...registerables)

  return (
    <PageContainer>
 
        <div
          style={{
            backgroundPosition: '100% -30%',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '274px auto',
            marginBottom:10,
            backgroundImage:
              "url('https://gw.alipayobjects.com/mdn/rms_a9745b/afts/img/A*BuFmQqsB2iAAAAAAAAAAAAAAARQnAQ')",
          }}
         
        >
          <div
            style={{
              fontSize: '20px',
              color: token.colorTextHeading,
            }}
          >
        
          </div>
       
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <InfoCard
              index={20}
              href="#"
              title="Requests"
              desc={`Total: ${requests?.requests_total} | Completed: ${requests?.requests_completed} | Active: ${requests?.requests_active}`}
            />
            <InfoCard
              index={2}
              title="Clients"
              href="#"
              desc={`Total: ${clients?.clients_total}  | Active: ${clients?.clients_active}`}
            />
            
          </div>
        </div>
     
  
        <div
          style={{
            marginBottom:10,
            backgroundPosition: '100% -30%',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '274px auto',
            backgroundImage:
              "url('https://gw.alipayobjects.com/mdn/rms_a9745b/afts/img/A*BuFmQqsB2iAAAAAAAAAAAAAAARQnAQ')",
          }}
        >
          <div
            style={{
              fontSize: '20px',
              color: token.colorTextHeading,
            }}
          >
        
          </div>
       
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <InfoCard
              index={20}
              href="#"
              title="Agents"
              desc={`Total: ${agents?.agents_total}  | Active: ${agents?.agents_active}`}
            />
            <InfoCard
              index={2}
              title="Providers"
              href="#"
              desc={`Total: ${providers?.providers_total} | Active: ${providers?.providers_active}`}
            />
            
          </div>
        </div>
         
        <Card>
  <Line data={chartConfig.data} options={options} />
</Card>
   
    </PageContainer>
  );
};

export default Welcome;
