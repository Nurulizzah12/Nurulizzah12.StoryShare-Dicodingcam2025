import API_ENDPOINT from '../globals/api-endpoint';

class UserModel {
  async register(userData) {
    try {
      const response = await fetch(API_ENDPOINT.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const responseJson = await response.json();
      
      if (!response.ok) {
        throw new Error(responseJson.message || 'Gagal melakukan registrasi');
      }
      
      return responseJson;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export default UserModel;